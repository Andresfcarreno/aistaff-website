// Una llamada de ConversationRelay: Twilio manda lo que dice la persona (ya transcrito
// por Deepgram, multilingüe) y este código responde con Claude en streaming; Twilio lo
// va diciendo con la voz ElevenLabs a medida que llegan las palabras.
// Cada turno se guarda en Supabase (`voice_sessions`); al colgar, el cron de Supabase
// analiza la llamada y la pasa a `calls`.

import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM } from "./prompt";

export interface Env {
  CALLS: DurableObjectNamespace;
  ANTHROPIC_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  VOICE_MODEL?: string;
  ANTHROPIC_BASE_URL?: string; // solo para pruebas locales
}

type Lang = "fr" | "en" | "es";
type Turn = { role: "assistant" | "user"; text: string; at: string };

const MAX_TURNS = 40;

function db(env: Env, path: string, init: RequestInit = {}): Promise<Response> {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  if (key.startsWith("eyJ")) headers.set("Authorization", `Bearer ${key}`);
  headers.set("Content-Type", "application/json");
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { ...init, headers });
}

let relaySecret: string | null = null;
async function getRelaySecret(env: Env): Promise<string | null> {
  if (relaySecret) return relaySecret;
  const r = await db(env, "rpc/get_app_secret", { method: "POST", body: JSON.stringify({ secret_name: "RELAY_SECRET" }) });
  const v = r.ok ? await r.json() : null;
  relaySecret = typeof v === "string" && v ? v : null;
  return relaySecret;
}

async function hmacHex(key: string, data: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(data)));
  return [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Idioma de la respuesta (para el análisis y el dashboard). Heurística simple.
function guessLang(text: string, fallback: Lang): Lang {
  const t = ` ${text.toLowerCase()} `;
  const score = (words: string[]) => words.reduce((n, w) => n + (t.includes(` ${w} `) ? 1 : 0), 0);
  const s: Record<Lang, number> = {
    es: score(["el", "la", "que", "usted", "para", "con", "es", "su", "gracias", "cuántas"]),
    en: score(["the", "you", "your", "is", "are", "and", "to", "how", "thanks", "what"]),
    fr: score(["le", "la", "vous", "est", "pour", "avec", "votre", "merci", "combien", "je"]),
  };
  const best = (Object.entries(s) as [Lang, number][]).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : fallback;
}

export function handleCall(socket: WebSocket, env: Env) {
  const client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    baseURL: env.ANTHROPIC_BASE_URL || undefined,
    timeout: 15000,
    maxRetries: 1,
  });
  const model = env.VOICE_MODEL || "claude-haiku-4-5";

  let sid = "";
  let turns: Turn[] = [];
  let lang: Lang = "fr";
  let current: ReturnType<typeof client.messages.stream> | null = null;
  let spoken = ""; // lo que ya se mandó a Twilio en la respuesta en curso
  let greetingSent = false;

  const send = (m: unknown) => {
    try {
      socket.send(JSON.stringify(m));
    } catch { /* socket cerrado */ }
  };
  const saveSession = (row: Record<string, unknown>) =>
    db(env, "voice_sessions?on_conflict=call_sid", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ call_sid: sid || "unknown", ...row, last_activity: new Date().toISOString() }),
    }).catch((e) => console.error("save failed", e));

  async function respond() {
    if (turns.filter((t) => t.role === "user").length > MAX_TURNS) {
      send({ type: "text", token: "Merci beaucoup! L'équipe d'AI Staff vous recontacte. Bonne journée!", last: true });
      setTimeout(() => send({ type: "end", handoffData: JSON.stringify({ reason: "max-turns" }) }), 6000);
      return;
    }
    const first = turns.findIndex((t) => t.role === "user");
    const messages = turns.slice(first).map((t) => ({ role: t.role, content: t.text }));
    spoken = "";
    let pending = ""; // texto retenido mientras puede ser el inicio de una etiqueta [[END]]
    const stream = client.messages.stream({ model, max_tokens: 300, system: SYSTEM, messages });
    current = stream;
    try {
      for await (const event of stream) {
        if (event.type !== "content_block_delta" || event.delta.type !== "text_delta") continue;
        pending = (pending + event.delta.text).replace(/\[\[END\]\]/gi, "");
        // Retener desde el primer "[": puede ser el inicio de [[END]] partido en fragmentos.
        const open = pending.indexOf("[");
        const out = open >= 0 ? pending.slice(0, open) : pending;
        pending = open >= 0 ? pending.slice(open) : "";
        if (out) {
          spoken += out;
          send({ type: "text", token: out, last: false });
        }
        if (pending.length > 12) { // no era una etiqueta: se suelta
          spoken += pending;
          send({ type: "text", token: pending, last: false });
          pending = "";
        }
      }
      const final = await stream.finalMessage();
      const rest = pending.replace(/\[\[END\]\]/gi, "");
      if (rest) {
        spoken += rest;
        send({ type: "text", token: rest, last: false });
      }
      send({ type: "text", token: "", last: true });
      const text = spoken.trim();
      const end = /\[\[END\]\]/i.test(final.content.map((b) => (b.type === "text" ? b.text : "")).join(""));
      if (text) {
        lang = guessLang(text, lang);
        turns.push({ role: "assistant", text, at: new Date().toISOString() });
        saveSession({ turns, lang, ended: end });
      }
      if (end) {
        // Dejar que termine de hablar antes de colgar (~75 ms por carácter + margen).
        setTimeout(() => send({ type: "end", handoffData: JSON.stringify({ reason: "assistant-ended-call" }) }),
          Math.min(20000, 1500 + text.length * 75));
      }
    } catch (e) {
      if (e instanceof Anthropic.APIUserAbortError) return; // interrupción: se maneja en "interrupt"
      console.error("claude error", e);
      const oops: Record<Lang, string> = {
        fr: "Désolée, j'ai eu un petit problème. Pouvez-vous répéter?",
        en: "Sorry, I had a small problem. Could you say that again?",
        es: "Perdón, tuve un pequeño problema. ¿Me lo repite?",
      };
      send({ type: "text", token: oops[lang], last: true });
    } finally {
      if (current === stream) current = null;
    }
  }

  // Enviar saludo al conectarse
  function sendGreeting() {
    if (greetingSent) return;
    greetingSent = true;
    send({ type: "text", token: GREETING, last: true });
    turns.push({ role: "assistant", text: GREETING, at: new Date().toISOString() });
    saveSession({ turns, lang });
  }

  socket.addEventListener("message", async (ev) => {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(String(ev.data));
    } catch (e) {
      // Logging de debugging
      console.log("First message not JSON (might be stream data):", String(ev.data).slice(0, 100));
      // Enviar saludo incluso si no es JSON válido
      if (!greetingSent) {
        sendGreeting();
      }
      return;
    }

    // Extraer sid si está disponible en cualquier mensaje
    if (msg.callSid && !sid) sid = String(msg.callSid);
    if (msg.from && !sid) sid = crypto.randomUUID(); // fallback

    // Enviar saludo en el primer contacto
    if (!greetingSent) {
      sendGreeting();
    }

    if (msg.type === "prompt") {
      if (msg.last === false) return; // solo el texto final de cada frase
      const text = String(msg.voicePrompt ?? "").trim();
      if (!text) return;
      current?.abort();
      turns.push({ role: "user", text, at: new Date().toISOString() });
      saveSession({ turns });
      await respond();
      return;
    }

    if (msg.type === "interrupt") {
      // La persona habló encima: se corta la respuesta y se guarda solo lo que alcanzó a oír.
      const heard = String(msg.utteranceUntilInterrupt ?? "").trim();
      if (current) {
        current.abort();
        current = null;
        if (heard) turns.push({ role: "assistant", text: heard, at: new Date().toISOString() });
      } else if (heard) {
        const last = turns[turns.length - 1];
        if (last?.role === "assistant") last.text = heard;
      }
      saveSession({ turns });
      return;
    }

    if (msg.type === "error") console.error("twilio error", JSON.stringify(msg));
  });

  socket.addEventListener("close", () => {
    current?.abort();
    saveSession({ turns });
  });
}
