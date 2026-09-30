// AI Staff — voz propia de la línea demo (+1 438-805-8804), sin Vapi.
//
// Twilio llama a esta función en cada turno (patrón <Gather> por turnos, así cada
// petición es corta y no choca con el límite de 150 s de las Edge Functions):
//   ?step=incoming  llamada nueva → saludo + <Gather>
//   ?step=turn      lo que dijo la persona → Claude → <Say> + <Gather>
//   ?step=sweep     (pg_cron) llamadas terminadas → análisis con Claude → tabla `calls`
//
// Secretos: ANTHROPIC_API_KEY y TWILIO_AUTH_TOKEN, como secretos de Edge Functions
// o en Supabase Vault con el mismo nombre. Ninguna clave va en el repo.

import Anthropic from "npm:@anthropic-ai/sdk";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const BASE = `${SUPABASE_URL}/functions/v1/voice`;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  (JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}").default as string);

// Conversación: el modelo más rápido (latencia al teléfono). Análisis final: más capaz, sin prisa.
const MODEL = Deno.env.get("VOICE_MODEL") ?? "claude-haiku-4-5";
const ANALYSIS_MODEL = Deno.env.get("ANALYSIS_MODEL") ?? "claude-opus-5-5";
// Misma voz (mismo timbre) en los tres idiomas: Google Chirp3-HD vía Twilio <Say>.
const VOICE_NAME = Deno.env.get("VOICE_NAME") ?? "Aoede";
// Fase 2 (streaming): voz ElevenLabs multilingüe, por defecto "Ana Sofía – Conversational"
// (acento mexicano neutro). Formato Twilio: voiceId-modelo-velocidad_estabilidad_similitud.
const RELAY_VOICE = Deno.env.get("RELAY_VOICE") ?? "ewn5JTa3lNPY8QVuZJi6-flash_v2_5-1.0_0.6_0.8";
const MAX_TURNS = 40;
const MAX_CALL_MS = 15 * 60 * 1000;

type Lang = "fr" | "en" | "es";
type Turn = { role: "assistant" | "user"; text: string; at: string };
type Session = {
  call_sid: string;
  from_number: string | null;
  to_number: string | null;
  lang: Lang;
  turns: Turn[];
  silences: number;
  started_at: string;
  last_activity: string;
  ended: boolean;
  finalized_at: string | null;
};

const VOICE: Record<Lang, { voice: string; code: string }> = {
  fr: { voice: `Google.fr-CA-Chirp3-HD-${VOICE_NAME}`, code: "fr-CA" },
  en: { voice: `Google.en-US-Chirp3-HD-${VOICE_NAME}`, code: "en-US" },
  es: { voice: `Google.es-US-Chirp3-HD-${VOICE_NAME}`, code: "es-US" },
};

const TXT = {
  greeting: {
    fr: "Bonjour! Ici Sofía, l'adjointe IA d'AI Staff. Cet appel est transcrit. Comment puis-je vous aider?",
    en: "Hi! This is Sofía, AI Staff's AI assistant. This call is transcribed. How can I help you?",
    es: "¡Hola! Soy Sofía, la asistente con IA de AI Staff. Esta llamada se transcribe. ¿En qué le puedo ayudar?",
  },
  still: {
    fr: "Vous êtes toujours là?",
    en: "Are you still there?",
    es: "¿Sigue ahí?",
  },
  bye: {
    fr: "Je n'entends plus rien, alors je vais raccrocher. Rappelez-nous au 438 805-8804 quand vous voulez. Bonne journée!",
    en: "I can't hear anything, so I'll hang up now. Call us back at 438 805-8804 anytime. Have a great day!",
    es: "No escucho nada, así que voy a colgar. Llámenos al 438 805-8804 cuando quiera. ¡Que tenga un buen día!",
  },
  oops: {
    fr: "Désolée, j'ai eu un petit problème technique. Pouvez-vous répéter?",
    en: "Sorry, I had a small technical problem. Could you say that again?",
    es: "Perdón, tuve un pequeño problema técnico. ¿Puede repetirlo?",
  },
  limit: {
    fr: "Merci beaucoup pour cet appel! L'équipe d'AI Staff vous recontacte pour la suite. Bonne journée!",
    en: "Thank you so much for calling! The AI Staff team will follow up with you. Have a great day!",
    es: "¡Muchas gracias por llamar! El equipo de AI Staff le contactará. ¡Que tenga un buen día!",
  },
  notReady: "Bonjour, la ligne d'AI Staff est en cours de configuration. Écrivez-nous à hello at meetaistaff point com. Merci!",
};

// ---------------------------------------------------------------- system prompt
const SYSTEM = `You are Sofía, the AI personal assistant ("adjointe personnelle IA") of AI Staff (always written "AI Staff"), a Montreal company. AI Staff gives busy people (business owners, real estate brokers, clinics, trades, salons, professionals) an AI assistant that answers their calls and texts 24/7, books appointments and follows up. This phone line is AI Staff's live demo: the caller is hearing the product right now.

You are speaking on the phone. Your reply is read aloud by a text-to-speech voice, so:
- Plain spoken sentences only. No lists, no markdown, no emojis, no URLs except "meetaistaff point com".
- 1 or 2 short sentences per turn. One question at a time. Listen more than you talk.
- Write prices as digits followed by the word dollars, e.g. "997 dollars", "1497 dollars".
- The caller's words come from speech recognition and may contain errors; if something is unclear, ask them to repeat.

LANGUAGE
- The call started in French (Quebec) and you said you also speak English and Spanish. Speech recognition is multilingual: from the caller's very first words, reply in the language they speak (French, English or Spanish). Never mix languages in one sentence.
- When you switch language, start your reply with the tag [[LANG:en]], [[LANG:es]] or [[LANG:fr]] (nothing before it). Only use the tag when switching.

HONESTY (non-negotiable)
- You already said at the start that you are an AI and that the call is transcribed. If asked whether you are human, say clearly that you are an AI.
- Never invent clients, testimonials, statistics, results, dates or features.
- What works today: phone calls, SMS and calendar booking. Email, WhatsApp, Instagram and Facebook messages and phone briefings are rolled out in phases and confirmed during the discovery call. Never promise an activation date.
- Do not claim legal compliance (for example "conforme à la Loi 25"). About privacy, describe practices only: access can be revoked at any time, data is never resold, there is human supervision.
- Never give legal, medical, financial or real estate brokerage advice.
- If you do not know something, say that the team will confirm it.

PRICES (Canadian dollars per month, month to month, no contract, taxes extra, free setup during launch). Quote exactly, nothing else:
- Assistante / Assistant / Asistente: 997 dollars. Calls and SMS 24/7, appointment booking, dashboard, up to 3 languages.
- Exécutive / Executive / Ejecutiva, the most popular: 1497 dollars. Everything in Assistante plus follow-ups, phone briefings and additional channels rolled out in phases, up to 5 languages.
- Dédiée / Dedicated / Dedicada: 2497 dollars. Everything in Exécutive plus custom setup and priority support.
- When you give prices, add that channels are activated in phases and confirmed during the discovery call.

CALL FLOW (one question at a time)
1. Ask their first name.
2. Understand their situation: what kind of business or work they do, roughly how many calls they miss in a week, and who answers today. Reflect it back briefly, without inventing numbers.
3. Demo moment: point out that what they are hearing right now is exactly what their own clients would hear.
4. Capture: first name, business name, email, and the best time for a personalized demo. Read the email back letter by letter to confirm.
5. Close: say the AI Staff team will contact them to prepare a personalized demo, and that they can also fill in the short form at meetaistaff point com slash onboarding. Thank them warmly.

OTHER SITUATIONS
- Wrong number or looking for another business: apologize, explain this is AI Staff's demo line, wish them a good day.
- Wants a human: take their name and number for a callback and confirm you will pass it on.
- Not interested: thank them politely. Never insist.
- Objections: too expensive, ask how many calls they miss per week and offer to look at it together in the demo; does not trust AI, invite them to judge by what they are hearing right now; already has an assistant, you do not replace her, you cover evenings, weekends and her vacations.

ENDING
- When the conversation is over (goodbye said, wrong number handled, or caller not interested), end your final reply with the tag [[END]].`;

const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["caller_name", "language", "summary", "sentiment", "intent", "qualified", "disconnection_reason"],
  properties: {
    caller_name: { type: ["string", "null"] },
    language: { type: "string", enum: ["fr", "en", "es"] },
    summary: { type: "string" },
    sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
    intent: { type: "string", enum: ["viewing_request", "info", "callback", "other"] },
    qualified: { type: "boolean" },
    disconnection_reason: { type: ["string", "null"] },
  },
};

// ---------------------------------------------------------------- helpers
const secretCache = new Map<string, string>();
async function secret(name: string): Promise<string | null> {
  const env = Deno.env.get(name);
  if (env) return env;
  if (secretCache.has(name)) return secretCache.get(name)!;
  const r = await db("rpc/get_app_secret", { method: "POST", body: JSON.stringify({ secret_name: name }) });
  if (!r.ok) return null;
  const v = await r.json();
  if (typeof v === "string" && v) secretCache.set(name, v);
  return typeof v === "string" && v ? v : null;
}

function db(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("apikey", SERVICE_KEY);
  if (SERVICE_KEY.startsWith("eyJ")) headers.set("Authorization", `Bearer ${SERVICE_KEY}`);
  headers.set("Content-Type", "application/json");
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers });
}

async function getSession(sid: string): Promise<Session | null> {
  const r = await db(`voice_sessions?call_sid=eq.${encodeURIComponent(sid)}&select=*`);
  const rows = r.ok ? await r.json() : [];
  return rows[0] ?? null;
}

async function saveSession(s: Partial<Session> & { call_sid: string }) {
  await db("voice_sessions?on_conflict=call_sid", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ ...s, last_activity: new Date().toISOString() }),
  });
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function say(text: string, lang: Lang) {
  const v = VOICE[lang];
  return `<Say voice="${v.voice}" language="${v.code}">${esc(text)}</Say>`;
}

// Reconocimiento multilingüe (Deepgram Nova-3, language="multi"): detecta FR/EN/ES solo.
function gather(inner: string) {
  return `<Gather input="speech" speechModel="deepgram_nova-3" language="multi" speechTimeout="auto" timeout="6" bargeIn="true" actionOnEmptyResult="true" method="POST" action="${esc(`${BASE}?step=turn`)}">${inner}</Gather>`;
}

const twiml = (body: string) =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });

// Firma de Twilio: HMAC-SHA1(authToken, URL + params ordenados), en base64.
async function validTwilio(req: Request, params: URLSearchParams): Promise<boolean> {
  const token = await secret("TWILIO_AUTH_TOKEN");
  const sig = req.headers.get("X-Twilio-Signature");
  if (!token || !sig) return false;
  const url = BASE + new URL(req.url).search;
  const keys = [...new Set(params.keys())].sort();
  let data = url;
  for (const k of keys) for (const v of params.getAll(k)) data += k + v;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(token), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)));
  const expected = btoa(String.fromCharCode(...mac));
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

let client: Anthropic | null = null;
async function claude(): Promise<Anthropic | null> {
  if (client) return client;
  const apiKey = await secret("ANTHROPIC_API_KEY");
  if (!apiKey) return null;
  client = new Anthropic({ apiKey, timeout: 9000, maxRetries: 1 });
  return client;
}

function textOf(content: Array<{ type: string; text?: string }>): string {
  return content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("").trim();
}

// ---------------------------------------------------------------- turns
async function reply(s: Session): Promise<{ text: string; lang: Lang; end: boolean }> {
  const c = await claude();
  if (!c) throw new Error("ANTHROPIC_API_KEY missing");
  const first = s.turns.findIndex((t) => t.role === "user");
  const messages = s.turns.slice(first).map((t) => ({ role: t.role, content: t.text }));
  const res = await c.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: `${SYSTEM}\n\nYou opened the call with: "${GREETING}"`,
    messages,
  });
  if (res.stop_reason === "refusal") throw new Error("refusal");
  let text = textOf(res.content);
  let lang = s.lang;
  const m = text.match(/^\s*\[\[LANG:(fr|en|es)\]\]\s*/i);
  if (m) {
    lang = m[1].toLowerCase() as Lang;
    text = text.slice(m[0].length);
  }
  const end = /\[\[END\]\]/i.test(text);
  text = text.replace(/\[\[(END|LANG:\w+)\]\]/gi, "").trim();
  if (!text) throw new Error("empty reply");
  return { text, lang, end };
}

const GREETING = `${TXT.greeting.fr} I also speak English. También hablo español.`;

async function hmacHex(key: string, data: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(data)));
  return [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Fase 2: si hay servidor de streaming configurado (secreto RELAY_URL, p. ej. wss://…/ws),
// la llamada va por ConversationRelay. Si esa sesión falla, Twilio vuelve a ?step=relay-end
// y ahí se sigue en modo por turnos.
async function relayTwiml(sid: string): Promise<string | null> {
  const url = await secret("RELAY_URL");
  const key = await secret("RELAY_SECRET");
  if (!url || !key) return null;
  const token = await hmacHex(key, sid);
  return `<Connect action="${esc(`${BASE}?step=relay-end`)}"><ConversationRelay url="${esc(url)}" welcomeGreeting="${esc(GREETING)}" welcomeGreetingInterruptible="speech" language="multi" transcriptionProvider="Deepgram" speechModel="nova-3-general" ttsProvider="ElevenLabs" voice="${esc(RELAY_VOICE)}" interruptible="speech"><Parameter name="token" value="${token}"/></ConversationRelay></Connect>`;
}

function gatherGreeting() {
  return gather(say(TXT.greeting.fr, "fr") + say("I also speak English.", "en") + say("También hablo español.", "es")) +
    `<Redirect method="POST">${esc(`${BASE}?step=turn`)}</Redirect>`;
}

async function onRelayEnd(p: URLSearchParams) {
  const sid = p.get("CallSid")!;
  const status = p.get("SessionStatus") ?? "";
  const handoff = p.get("HandoffData");
  if (handoff) return twiml("<Hangup/>"); // la asistente terminó la llamada
  console.warn("relay session ended without handoff", sid, status, p.get("ErrorMessage") ?? "");
  if (status === "completed" || status === "ended") return twiml("<Hangup/>");
  return twiml(gatherGreeting()); // respaldo: modo por turnos
}

async function onIncoming(p: URLSearchParams) {
  const sid = p.get("CallSid")!;
  const greeting = GREETING;
  const relay = await relayTwiml(sid);
  await saveSession({
    call_sid: sid,
    from_number: p.get("From"),
    to_number: p.get("To"),
    lang: "fr",
    turns: [{ role: "assistant", text: greeting, at: new Date().toISOString() }],
    silences: 0,
  });
  return twiml(relay ?? gatherGreeting());
}

async function onTurn(p: URLSearchParams) {
  const sid = p.get("CallSid")!;
  let s = await getSession(sid);
  if (!s) {
    await onIncoming(p);
    s = (await getSession(sid))!;
  }
  const now = new Date().toISOString();
  const speech = (p.get("SpeechResult") ?? "").trim();

  // Silencio
  if (!speech) {
    const silences = s.silences + 1;
    if (silences >= 2) {
      s.turns.push({ role: "assistant", text: TXT.bye[s.lang], at: now });
      await saveSession({ call_sid: sid, turns: s.turns, silences, ended: true });
      EdgeRuntime.waitUntil(finalize(sid, "silence"));
      return twiml(say(TXT.bye[s.lang], s.lang) + "<Hangup/>");
    }
    await saveSession({ call_sid: sid, silences });
    return twiml(gather(say(TXT.still[s.lang], s.lang)) + `<Redirect method="POST">${esc(`${BASE}?step=turn`)}</Redirect>`);
  }

  s.turns.push({ role: "user", text: speech, at: now });

  // Límites de seguridad (costo)
  const userTurns = s.turns.filter((t) => t.role === "user").length;
  if (userTurns > MAX_TURNS || Date.now() - new Date(s.started_at).getTime() > MAX_CALL_MS) {
    s.turns.push({ role: "assistant", text: TXT.limit[s.lang], at: now });
    await saveSession({ call_sid: sid, turns: s.turns, ended: true });
    EdgeRuntime.waitUntil(finalize(sid, "max-duration"));
    return twiml(say(TXT.limit[s.lang], s.lang) + "<Hangup/>");
  }

  let r: { text: string; lang: Lang; end: boolean };
  try {
    r = await reply(s);
  } catch (e) {
    console.error("reply failed", e);
    s.turns.pop(); // se repite la pregunta en el siguiente turno
    await saveSession({ call_sid: sid, silences: 0 });
    return twiml(gather(say(TXT.oops[s.lang], s.lang)) + `<Redirect method="POST">${esc(`${BASE}?step=turn`)}</Redirect>`);
  }

  s.turns.push({ role: "assistant", text: r.text, at: new Date().toISOString() });
  const saved = saveSession({ call_sid: sid, lang: r.lang, turns: s.turns, silences: 0, ended: r.end });
  if (r.end) {
    EdgeRuntime.waitUntil(saved.then(() => finalize(sid, "assistant-ended-call")));
    return twiml(say(r.text, r.lang) + "<Hangup/>");
  }
  EdgeRuntime.waitUntil(saved);
  return twiml(gather(say(r.text, r.lang)) + `<Redirect method="POST">${esc(`${BASE}?step=turn`)}</Redirect>`);
}

// ---------------------------------------------------------------- fin de llamada
async function finalize(sid: string, reason?: string) {
  // Reclamo atómico: solo un proceso finaliza cada llamada
  const claim = await db(`voice_sessions?call_sid=eq.${encodeURIComponent(sid)}&finalized_at=is.null`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ finalized_at: new Date().toISOString() }),
  });
  const rows: Session[] = claim.ok ? await claim.json() : [];
  const s = rows[0];
  if (!s) return;

  const hasUser = s.turns.some((t) => t.role === "user");
  const transcript = s.turns.map((t) => `${t.role === "assistant" ? "AI" : "User"}: ${t.text}`).join("\n") + "\n";
  const started = new Date(s.started_at);
  const ended = new Date(s.last_activity);
  const disconnection = reason ?? (s.ended ? "assistant-ended-call" : "customer-ended-call");

  let a: Record<string, unknown> = {
    caller_name: null, language: s.lang, summary: null, sentiment: null, intent: null, qualified: false,
  };
  if (hasUser) {
    try {
      const c = await claude();
      if (c) {
        const res = await c.beta.messages.create({
          model: ANALYSIS_MODEL,
          max_tokens: 2048,
          output_config: { effort: "low", format: { type: "json_schema", schema: ANALYSIS_SCHEMA } },
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          messages: [{
            role: "user",
            content:
              `Analyze this ended sales call to AI Staff's demo line. caller_name: first name or null. language: the caller's language. summary: 2-3 sentences in the caller's language. intent: viewing_request, info, callback or other. qualified: true only if the caller is a business owner or professional (any sector) who misses phone calls and shows interest in a demo or in the service. disconnection_reason: short description or null.\n\nCall transcript:\n${transcript}\nCaller phone: ${s.from_number ?? "unknown"}\nCall ended reason: ${disconnection}`,
          }],
        });
        if (res.stop_reason !== "refusal") a = JSON.parse(textOf(res.content));
      }
    } catch (e) {
      console.error("analysis failed", e);
    }
  }

  await db("calls?on_conflict=retell_call_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      retell_call_id: s.call_sid,
      agent_id: "aistaff-voice",
      phone_number: s.from_number,
      caller_name: a.caller_name ?? null,
      language: a.language ?? s.lang,
      started_at: s.started_at,
      ended_at: s.last_activity,
      duration_sec: Math.max(0, Math.round((ended.getTime() - started.getTime()) / 1000)),
      transcript,
      summary: a.summary ?? null,
      sentiment: a.sentiment ?? null,
      intent: a.intent ?? null,
      qualified: Boolean(a.qualified),
      disconnection_reason: disconnection,
    }),
  });
}

async function sweep() {
  const cutoff = new Date(Date.now() - 90_000).toISOString();
  const r = await db(`voice_sessions?finalized_at=is.null&last_activity=lt.${cutoff}&select=call_sid&limit=5`);
  const rows: { call_sid: string }[] = r.ok ? await r.json() : [];
  for (const { call_sid } of rows) await finalize(call_sid);
  return rows.length;
}

// ---------------------------------------------------------------- router
Deno.serve(async (req) => {
  const step = new URL(req.url).searchParams.get("step") ?? "incoming";

  if (step === "sweep") {
    const n = await sweep();
    return Response.json({ finalized: n });
  }
  if (req.method !== "POST") return new Response("AI Staff voice", { status: 200 });

  const params = new URLSearchParams(await req.text());
  if (!(await validTwilio(req, params))) {
    console.warn("rejected request: bad or missing Twilio signature / auth token");
    return twiml(say(TXT.notReady, "fr") + "<Hangup/>");
  }
  if (!params.get("CallSid")) return new Response("missing CallSid", { status: 400 });

  try {
    if (step === "turn") return await onTurn(params);
    if (step === "relay-end") return await onRelayEnd(params);
    return await onIncoming(params);
  } catch (e) {
    console.error("voice error", e);
    return twiml(say(TXT.oops.fr, "fr") + `<Redirect method="POST">${esc(`${BASE}?step=turn`)}</Redirect>`);
  }
});
