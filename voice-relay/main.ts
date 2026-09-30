// AI Staff — servidor de voz en streaming para Twilio ConversationRelay (fase 2).
//
// Twilio hace el reconocimiento de voz (Deepgram, multilingüe) y la síntesis (ElevenLabs);
// este servidor recibe el texto de la persona por WebSocket, responde con Claude en
// streaming (Twilio empieza a hablar con las primeras palabras) y guarda cada turno en
// Supabase (`voice_sessions`). Al colgar, el cron de Supabase analiza la llamada y la
// pasa a `calls`, igual que en el modo por turnos.
//
// Variables de entorno: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// opcional VOICE_MODEL y PORT. RELAY_SECRET se lee de Supabase Vault.

import Anthropic from "npm:@anthropic-ai/sdk";
import { SYSTEM } from "./prompt.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = Deno.env.get("VOICE_MODEL") ?? "claude-haiku-4-5";
const MAX_TURNS = 40;

type Lang = "fr" | "en" | "es";
type Turn = { role: "assistant" | "user"; text: string; at: string };

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY"), timeout: 15000, maxRetries: 1 });

// ---------------------------------------------------------------- Supabase
function db(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("apikey", SERVICE_KEY);
  if (SERVICE_KEY.startsWith("eyJ")) headers.set("Authorization", `Bearer ${SERVICE_KEY}`);
  headers.set("Content-Type", "application/json");
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers });
}

let relaySecret: string | null = null;
async function getRelaySecret(): Promise<string | null> {
  if (relaySecret) return relaySecret;
  const r = await db("rpc/get_app_secret", { method: "POST", body: JSON.stringify({ secret_name: "RELAY_SECRET" }) });
  const v = r.ok ? await r.json() : null;
  relaySecret = typeof v === "string" && v ? v : null;
  return relaySecret;
}

async function hmacHex(key: string, data: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(data)));
  return [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function loadTurns(sid: string): Promise<{ turns: Turn[]; lang: Lang } | null> {
  const r = await db(`voice_sessions?call_sid=eq.${encodeURIComponent(sid)}&select=turns,lang`);
  const rows = r.ok ? await r.json() : [];
  return rows[0] ?? null;
}

function saveSession(row: Record<string, unknown>) {
  return db("voice_sessions?on_conflict=call_sid", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ ...row, last_activity: new Date().toISOString() }),
  }).catch((e) => console.error("save failed", e));
}

// Idioma de la respuesta (para el análisis y el dashboard). Heurística simple.
function guessLang(text: string, fallback: Lang): Lang {
  const t = ` ${text.toLowerCase()} `;
  const score = (words: string[]) => words.reduce((n, w) => n + (t.includes(` ${w} `) ? 1 : 0), 0);
  const s = { es: score(["el", "la", "que", "usted", "para", "con", "es", "su", "gracias", "cuántas"]),
    en: score(["the", "you", "your", "is", "are", "and", "to", "how", "thanks", "what"]),
    fr: score(["le", "la", "vous", "est", "pour", "avec", "votre", "merci", "combien", "je"]) };
  const best = (Object.entries(s) as [Lang, number][]).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : fallback;
}

// ---------------------------------------------------------------- una llamada
function handleCall(socket: WebSocket) {
  let sid = "";
  let authed = false;
  let turns: Turn[] = [];
  let lang: Lang = "fr";
  let current: ReturnType<typeof client.messages.stream> | null = null;
  let spoken = ""; // lo que ya se mandó a Twilio en la respuesta en curso
  const send = (m: unknown) => socket.readyState === WebSocket.OPEN && socket.send(JSON.stringify(m));

  async function respond() {
    const userTurns = turns.filter((t) => t.role === "user").length;
    if (userTurns > MAX_TURNS) {
      send({ type: "text", token: "Merci beaucoup! L'équipe d'AI Staff vous recontacte. Bonne journée!", last: true });
      setTimeout(() => send({ type: "end", handoffData: JSON.stringify({ reason: "max-turns" }) }), 6000);
      return;
    }
    const first = turns.findIndex((t) => t.role === "user");
    const messages = turns.slice(first).map((t) => ({ role: t.role, content: t.text }));
    spoken = "";
    let pending = ""; // texto retenido mientras puede ser el inicio de una etiqueta [[END]]
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 300,
      system: SYSTEM,
      messages,
    });
    current = stream;
    try {
      for await (const event of stream) {
        if (event.type !== "content_block_delta" || event.delta.type !== "text_delta") continue;
        pending = (pending + event.delta.text).replace(/\[\[END\]\]/gi, "");
        // Retener desde el primer "[" sin cerrar: puede ser el inicio de [[END]] partido en fragmentos.
        const open = pending.indexOf("[");
        const cut = open >= 0 ? open : pending.length;
        const out = pending.slice(0, cut);
        pending = pending.slice(cut);
        if (pending.length > 12) { // no era una etiqueta: se suelta
          spoken += pending;
          send({ type: "text", token: pending, last: false });
          pending = "";
        }
        if (out) {
          spoken += out;
          send({ type: "text", token: out, last: false });
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
      const end = /\[\[END\]\]/i.test(
        final.content.map((b) => (b.type === "text" ? b.text : "")).join(""),
      );
      if (text) {
        lang = guessLang(text, lang);
        turns.push({ role: "assistant", text, at: new Date().toISOString() });
        saveSession({ call_sid: sid, turns, lang, ended: end });
      }
      if (end) {
        // Dejar que termine de hablar antes de colgar (~75 ms por carácter + margen).
        setTimeout(() => send({ type: "end", handoffData: JSON.stringify({ reason: "assistant-ended-call" }) }),
          Math.min(20000, 1500 + text.length * 75));
      }
    } catch (e) {
      if (e instanceof Anthropic.APIUserAbortError) return; // interrupción: se maneja en el mensaje "interrupt"
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

  socket.onmessage = async (ev) => {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(String(ev.data));
    } catch {
      return;
    }

    if (msg.type === "setup") {
      sid = String(msg.callSid ?? "");
      const params = (msg.customParameters ?? {}) as Record<string, string>;
      const secret = await getRelaySecret();
      authed = !!secret && !!sid && params.token === (await hmacHex(secret, sid));
      if (!authed) {
        console.warn("rejected session: bad token", sid);
        socket.close(1008, "unauthorized");
        return;
      }
      const s = await loadTurns(sid);
      if (s) {
        turns = s.turns ?? [];
        lang = s.lang ?? "fr";
      } else {
        turns = [];
        await saveSession({ call_sid: sid, from_number: msg.from ?? null, to_number: msg.to ?? null, lang, turns });
      }
      return;
    }
    if (!authed) return;

    if (msg.type === "prompt") {
      if (msg.last === false) return; // solo el texto final de cada frase
      const text = String(msg.voicePrompt ?? "").trim();
      if (!text) return;
      if (current) current.abort();
      turns.push({ role: "user", text, at: new Date().toISOString() });
      saveSession({ call_sid: sid, turns });
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
      saveSession({ call_sid: sid, turns });
      return;
    }

    if (msg.type === "error") console.error("twilio error", msg);
  };

  socket.onclose = () => {
    current?.abort();
    if (sid && authed) saveSession({ call_sid: sid, turns });
  };
}

// ---------------------------------------------------------------- servidor
Deno.serve({ port: Number(Deno.env.get("PORT") ?? 8080) }, (req) => {
  const { pathname } = new URL(req.url);
  if (pathname === "/health") return new Response("ok");
  if (pathname !== "/ws" || req.headers.get("upgrade")?.toLowerCase() !== "websocket") {
    return new Response("AI Staff voice relay", { status: 200 });
  }
  const { socket, response } = Deno.upgradeWebSocket(req);
  handleCall(socket);
  return response;
});
