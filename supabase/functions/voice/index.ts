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

A large share of callers are Spanish-speaking (Latino) business owners in Canada and the USA: contractors, movers, garages, cleaners, salons, small shops. Their real problem is that their own customers speak English or French while they are most comfortable in Spanish, and they lose calls while working. This is your sharpest pitch for them:
- You answer THEIR customers in the customer's language (English, French or Spanish), 24/7, and you report to the owner in Spanish: who called, what they wanted, and what was booked.
- So the owner keeps working in Spanish and never loses a customer because of language or a missed call.
- The voice they hear on this demo is only one example. Each business can have its own native-sounding voice (a different accent or gender, for instance), chosen during setup and confirmed in the discovery call. Never say every business gets the same voice. Do not promise a specific voice or custom voice cloning; say the team will go over the options.
- If the caller is Spanish-speaking, talk to them in warm, natural Latin American Spanish (neutral Mexican is fine), friendly but respectful. If they come from an ad ("vi una publicidad"), ask what they saw and where, in one short question, and note it.
- When it fits, offer to prove it: invite them to say a sentence in English or French and hear how you answer, so they can judge for themselves.

You are speaking on the phone. Your reply is read aloud by a text-to-speech voice, so:
- Plain spoken sentences only. No lists, no markdown, no emojis, no URLs except "meetaistaff point com".
- 1 or 2 short sentences per turn. One question at a time. Listen more than you talk.
- Write prices as digits followed by the word dollars, e.g. "397 dollars", "597 dollars".
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

PRICES (Canadian dollars per month, plus taxes, month to month, no contract, free setup during launch). Quote exactly, nothing else. The three plans are equal: never call one "the most popular"; recommend the one that fits what the caller told you.
- Essentiel / Essential / Esencial: 397 dollars. A dedicated phone number, calls answered 24/7 in French, English and Spanish, SMS, appointment booking, a private dashboard, and the owner can call their assistant to ask for a report (rolled out in phases).
- Pro: 597 dollars. Everything in Essentiel, plus WhatsApp, scheduled calls from the assistant to the owner (up to 3 per day) and unlimited calls with fair use.
- Complet / Complete / Completo: 797 dollars. Everything in Pro, plus Instagram and Facebook messages, social media metrics and priority access.
- Taxes are extra (in Quebec, GST and QST). When you give prices, add that reports by phone, WhatsApp, scheduled calls, Instagram and Facebook are activated in phases and confirmed during the discovery call.
- If asked to compare: a human assistant costs an estimated 3500 to 4500 dollars per month. Always say it is an estimate.

CALL FLOW (one question at a time)
1. Ask their first name.
2. Understand their situation: what kind of business or work they do, roughly how many calls they miss in a week, and who answers today. Reflect it back briefly, without inventing numbers.
3. Demo moment: offer to prove it with their own business. Say something like: "If you want, I become the assistant of your business and you are a customer who calls. Ask me what your customers usually ask." If they accept, do the role-play: first ask what the business is called, what it does, opening hours and main services (one question at a time). Then answer as that business's assistant, greeting with the business name, using ONLY what they told you. If a "customer" asks for an appointment, offer two times inside the hours they gave and confirm it without claiming a real calendar was touched. If you do not know something, say you will take a message. If they ask to leave the role-play, go back to being Sofía of AI Staff. Afterwards ask what they thought. If they are Spanish-speaking, suggest trying a customer who speaks English or French so they hear you switch languages.
4. Capture: first name, business name, email, and the best time for a personalized demo.
   EMAIL RULES (speech recognition often garbles emails): never guess or invent letters. Only repeat back what the caller actually said. If the email sounded unclear or contained words instead of letters, ask them to spell it slowly, letter by letter, and say "arroba" / "at" and "punto" / "dot" for the symbols. Read it back letter by letter and wait for a clear yes. If after two tries it is still unclear, do not force it: say the team will confirm it by phone, and make sure you have their name and best callback time.
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
  required: ["caller_name", "language", "summary", "sentiment", "intent", "qualified", "disconnection_reason", "business_name", "sector", "email", "callback_time"],
  properties: {
    caller_name: { type: ["string", "null"] },
    language: { type: "string", enum: ["fr", "en", "es"] },
    summary: { type: "string" },
    sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
    intent: { type: "string", enum: ["viewing_request", "info", "callback", "other"] },
    qualified: { type: "boolean" },
    disconnection_reason: { type: ["string", "null"] },
    business_name: { type: ["string", "null"] },
    sector: { type: ["string", "null"] },
    email: { type: ["string", "null"] },
    callback_time: { type: ["string", "null"] },
  },
};

// Llamadas a la línea de un CLIENTE (no la demo): resumen para el dueño del negocio.
const DEMO_TENANT = "00000000-0000-0000-0000-000000000001";
type Tenant = { id: string; name: string; business_info: string | null; greeting: string | null; notify_phone: string | null; report_lang: string | null; twilio_number: string | null };
const CLIENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["caller_name", "language", "summary", "sentiment", "intent", "callback_number", "requested_time", "requested_datetime", "service"],
  properties: {
    caller_name: { type: ["string", "null"] },
    language: { type: "string", enum: ["fr", "en", "es"] },
    summary: { type: "string" },
    sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
    intent: { type: "string", enum: ["appointment_request", "quote_request", "info", "callback", "complaint", "other"] },
    callback_number: { type: ["string", "null"] },
    requested_time: { type: ["string", "null"] },
    requested_datetime: { type: ["string", "null"] },
    service: { type: ["string", "null"] },
  },
};
const LANG_NAME: Record<string, string> = { es: "Spanish", fr: "French", en: "English" };

async function clientTenant(toNumber: string | null): Promise<Tenant | null> {
  if (!toNumber) return null;
  const r = await db(`tenants?twilio_number=eq.${encodeURIComponent(toNumber)}&select=id,name,business_info,greeting,notify_phone,report_lang,twilio_number&limit=1`);
  const t: Tenant | undefined = r.ok ? (await r.json())[0] : undefined;
  return t && t.id !== DEMO_TENANT && t.business_info?.trim() ? t : null;
}

// Mismo saludo y guion que voice-relay/src/prompt.ts (clientGreeting / clientSystem).
function clientGreeting(t: Tenant): string {
  return t.greeting?.trim() ||
    `Bonjour, vous avez joint ${t.name}. Ici l'adjointe virtuelle; cet appel est transcrit. Comment puis-je vous aider? I also speak English. También hablo español.`;
}
function clientSystem(t: Tenant): string {
  return `You are the AI phone assistant (receptionist) of "${t.name}", a business in the Montreal area. You answer its incoming calls when the team cannot.

You opened the call with: "${clientGreeting(t)}"

BUSINESS INFORMATION (your only source of truth about this business):
"""
${t.business_info?.trim()}
"""

You are speaking on the phone. Your reply is read aloud by a text-to-speech voice, so:
- Plain spoken sentences only. No lists, no markdown, no emojis, no URLs.
- 1 or 2 short sentences per turn. One question at a time. Be warm, calm and efficient.
- The caller's words come from speech recognition and may contain errors; if something is unclear, ask them to repeat.

LANGUAGE
- Always reply in the language the caller is speaking right now: French (Quebec), English or Spanish. Never mix languages in one sentence.
- When you switch language, start your reply with the tag [[LANG:en]], [[LANG:es]] or [[LANG:fr]] (nothing before it). Only use the tag when switching.

RULES (non-negotiable)
- You are an AI assistant, and you already said the call is transcribed. If asked whether you are human, say clearly that you are an AI assistant.
- Use ONLY the business information above. Never invent prices, hours, services, availability, policies, names or promises. If the answer is not there, say you will pass the question to the team and take a message.
- Appointments and quotes: you cannot see the real calendar. Ask what they need, their preferred day and time (inside the business hours if they are listed), their name and the best number to reach them. Then say the team will confirm by text or by phone. Never say an appointment is confirmed or booked.
- Messages: get the caller's name, the reason for the call and the best number and time to call back. Read the number back to confirm it.
- Emergencies (fire, injury, danger, a medical emergency): tell them to hang up and call 911 now.
- Never give medical, legal, financial or real estate brokerage advice. Never ask for passwords, card numbers or bank details.
- Do not talk about AI Staff. Only if asked who provides this assistant, say "AI Staff, at meetaistaff point com".
- If the caller is rude or the call is clearly spam, end politely.

ENDING
- Before ending, briefly confirm what you will pass on to the team. When the conversation is over, end your final reply with the tag [[END]].`;
}
const CLIENT_TXT = {
  bye: {
    fr: "Je n'entends plus rien, alors je vais raccrocher. Rappelez-nous quand vous voulez. Bonne journée!",
    en: "I can't hear anything, so I'll hang up now. Call us back anytime. Have a great day!",
    es: "No escucho nada, así que voy a colgar. Llámenos cuando quiera. ¡Que tenga un buen día!",
  },
  limit: {
    fr: "Merci beaucoup pour votre appel! L'équipe vous recontacte. Bonne journée!",
    en: "Thank you for calling! The team will get back to you. Have a great day!",
    es: "¡Muchas gracias por llamar! El equipo le contactará. ¡Que tenga un buen día!",
  },
};

// SMS al dueño con el resumen de la llamada (sale del número del cliente).
async function notifyOwner(t: Tenant, s: Session, a: Record<string, unknown>) {
  if (!t.notify_phone) return;
  const [sid, token] = await Promise.all([secret("TWILIO_ACCOUNT_SID"), secret("TWILIO_AUTH_TOKEN")]);
  if (!sid || !token) {
    console.warn("owner sms skipped: missing TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN");
    return;
  }
  const who = [a.caller_name, a.callback_number ?? s.from_number].filter((x) => typeof x === "string" && x).join(" · ");
  const when = typeof a.requested_time === "string" && a.requested_time ? ` (${a.requested_time})` : "";
  const body = `${t.name}: llamada de ${who || "número oculto"}${when}. ${a.summary ?? ""} Panel: meetaistaff.com/demo/`.slice(0, 600);
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${sid}:${token}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ From: t.twilio_number ?? "+14388058804", To: t.notify_phone, Body: body }),
  });
  if (!r.ok) console.error("owner sms failed", r.status, (await r.text()).slice(0, 200));
}

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
  const t = await clientTenant(s.to_number);
  const res = await c.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: t ? clientSystem(t) : `${SYSTEM}\n\nYou opened the call with: "${GREETING}"`,
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
async function relayTwiml(sid: string, greeting = GREETING, tenantId?: string): Promise<string | null> {
  const url = await secret("RELAY_URL");
  const key = await secret("RELAY_SECRET");
  if (!url || !key) return null;
  const token = await hmacHex(key, sid);
  const wsUrl = `${url}${url.includes("?") ? "&" : "?"}sid=${encodeURIComponent(sid)}${tenantId ? `&t=${encodeURIComponent(tenantId)}` : ""}`; // un Durable Object por llamada; t = cliente
  return `<Connect action="${esc(`${BASE}?step=relay-end`)}"><ConversationRelay url="${esc(wsUrl)}" welcomeGreeting="${esc(greeting)}" welcomeGreetingInterruptible="speech" language="multi" transcriptionProvider="Deepgram" speechModel="nova-3-general" ttsProvider="ElevenLabs" voice="${esc(RELAY_VOICE)}" interruptible="speech"><Parameter name="token" value="${token}"/></ConversationRelay></Connect>`;
}

function gatherGreeting(t?: Tenant | null) {
  if (t) return gather(say(clientGreeting(t), "fr")) + `<Redirect method="POST">${esc(`${BASE}?step=turn`)}</Redirect>`;
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
  return twiml(gatherGreeting(await clientTenant(p.get("To")))); // respaldo: modo por turnos
}

async function onIncoming(p: URLSearchParams) {
  const sid = p.get("CallSid")!;
  const tenant = await clientTenant(p.get("To")); // número de un cliente → su saludo y su guion
  const greeting = tenant ? clientGreeting(tenant) : GREETING;
  const relay = await relayTwiml(sid, greeting, tenant?.id);
  await saveSession({
    call_sid: sid,
    from_number: p.get("From"),
    to_number: p.get("To"),
    lang: "fr",
    turns: [{ role: "assistant", text: greeting, at: new Date().toISOString() }],
    silences: 0,
  });
  return twiml(relay ?? gatherGreeting(tenant));
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
  const T = (await clientTenant(s.to_number)) ? { ...TXT, ...CLIENT_TXT } : TXT;

  // Silencio
  if (!speech) {
    const silences = s.silences + 1;
    if (silences >= 2) {
      s.turns.push({ role: "assistant", text: T.bye[s.lang], at: now });
      await saveSession({ call_sid: sid, turns: s.turns, silences, ended: true });
      EdgeRuntime.waitUntil(finalize(sid, "silence"));
      return twiml(say(T.bye[s.lang], s.lang) + "<Hangup/>");
    }
    await saveSession({ call_sid: sid, silences });
    return twiml(gather(say(TXT.still[s.lang], s.lang)) + `<Redirect method="POST">${esc(`${BASE}?step=turn`)}</Redirect>`);
  }

  s.turns.push({ role: "user", text: speech, at: now });

  // Límites de seguridad (costo)
  const userTurns = s.turns.filter((t) => t.role === "user").length;
  if (userTurns > MAX_TURNS || Date.now() - new Date(s.started_at).getTime() > MAX_CALL_MS) {
    s.turns.push({ role: "assistant", text: T.limit[s.lang], at: now });
    await saveSession({ call_sid: sid, turns: s.turns, ended: true });
    EdgeRuntime.waitUntil(finalize(sid, "max-duration"));
    return twiml(say(T.limit[s.lang], s.lang) + "<Hangup/>");
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

  // Número de un cliente: reporte para su dueño, sin crear leads de AI Staff.
  const tenant = await clientTenant(s.to_number);
  if (tenant) return finalizeClient(tenant, s, transcript, disconnection, hasUser);

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
              `Analyze this ended sales call to AI Staff's demo line. caller_name: first name or null. language: the caller's language. summary: 2-3 sentences in the caller's language. intent: viewing_request, info, callback or other. qualified: true only if the caller is a business owner or professional (any sector) who misses phone calls and shows interest in a demo or in the service. disconnection_reason: short description or null. business_name: the caller's own business name or null (not a business invented during a role-play unless it is theirs). sector: their line of work in 1 to 3 words, in the caller's language, or null. email: only if the caller gave it and confirmed it, lowercase, otherwise null; never guess letters. callback_time: the best time they gave for a callback or demo, in their own words, or null.\n\nCall transcript:\n${transcript}\nCaller phone: ${s.from_number ?? "unknown"}\nCall ended reason: ${disconnection}`,
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

  // Un interesado se vuelve lead (misma bandeja que el formulario de /onboarding/).
  const email = typeof a.email === "string" && /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(a.email) ? a.email.toLowerCase() : null;
  if (a.qualified || email) await saveCallLead(s, a, email);
}

async function finalizeClient(t: Tenant, s: Session, transcript: string, disconnection: string, hasUser: boolean) {
  const report = LANG_NAME[t.report_lang ?? "es"] ?? "Spanish";
  let a: Record<string, unknown> = { caller_name: null, language: s.lang, summary: null, sentiment: null, intent: null };
  if (hasUser) {
    try {
      const c = await claude();
      if (c) {
        const res = await c.beta.messages.create({
          model: ANALYSIS_MODEL,
          max_tokens: 2048,
          output_config: { effort: "low", format: { type: "json_schema", schema: CLIENT_SCHEMA } },
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          messages: [{
            role: "user",
            content:
              `This is a call to the phone line of the business "${t.name}", answered by its AI assistant. Write the report for the business owner. caller_name: the caller's name or null. language: the language the caller spoke. summary: 1 to 3 short sentences in ${report} for the owner: who called, what they want, and what the assistant said it would pass on; include any appointment or quote details. Do not invent anything. sentiment: the caller's. intent: appointment_request, quote_request, info, callback, complaint or other. callback_number: a number the caller gave to call back, or null (their caller ID is ${s.from_number ?? "unknown"}). requested_time: the day or time they asked for, in their own words, or null. requested_datetime: only if they asked for an appointment and gave a specific enough day and time, that moment as ISO 8601 with the Montreal offset (e.g. 2026-10-08T14:00:00-04:00), resolving words like "tomorrow" or "Thursday" from the call date below; otherwise null. service: what the appointment or request is for, in 1 to 5 words in ${report}, or null.\n\nCall date and time (Montreal): ${montreal(s.started_at)}\nCall transcript:\n${transcript}\nCall ended reason: ${disconnection}`,
          }],
        });
        if (res.stop_reason !== "refusal") a = JSON.parse(textOf(res.content));
      }
    } catch (e) {
      console.error("client analysis failed", e);
    }
  }
  const started = new Date(s.started_at);
  const ended = new Date(s.last_activity);
  const saved = await db("calls?on_conflict=retell_call_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      retell_call_id: s.call_sid,
      tenant_id: t.id,
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
      qualified: false,
      disconnection_reason: disconnection,
    }),
  });
  const callId: string | undefined = saved.ok ? (await saved.json())[0]?.id : undefined;
  if (hasUser && (a.intent === "appointment_request" || a.requested_datetime)) await saveBooking(t, s, a, callId);
  if (hasUser) await notifyOwner(t, s, a);
}

// Fecha de la llamada en hora de Montreal, para que el análisis resuelva "mañana", "el jueves"…
function montreal(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Montreal", weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  }).format(new Date(iso));
}

// Solicitud de cita de un cliente del negocio → `bookings` (estado "requested": el equipo
// la confirma; la asistente nunca da una cita por confirmada). El dueño la ve en su agenda.
async function saveBooking(t: Tenant, s: Session, a: Record<string, unknown>, callId?: string) {
  if (callId) {
    const seen = await db(`bookings?call_id=eq.${encodeURIComponent(callId)}&select=id`);
    if (seen.ok && (await seen.json()).length) return;
  }
  const str = (k: string) => (typeof a[k] === "string" && a[k] ? (a[k] as string) : null);
  const when = str("requested_datetime");
  const at = when && !Number.isNaN(Date.parse(when)) ? new Date(when).toISOString() : null;
  const r = await db("bookings", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      tenant_id: t.id,
      call_id: callId ?? null,
      contact_name: str("caller_name"),
      contact_phone: str("callback_number") ?? s.from_number,
      booking_type: str("service"),
      scheduled_for: at,
      status: "requested",
      notes: [str("requested_time"), str("summary")].filter(Boolean).join(" · ") || null,
    }),
  });
  if (!r.ok) console.error("booking insert failed", r.status, await r.text());
}

async function saveCallLead(s: Session, a: Record<string, unknown>, email: string | null) {
  const seen = await db(`leads?payload->>call_sid=eq.${encodeURIComponent(s.call_sid)}&select=id`);
  if (seen.ok && (await seen.json()).length) return;
  const str = (k: string) => (typeof a[k] === "string" && a[k] ? (a[k] as string) : null);
  const r = await db("leads", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      first_name: str("caller_name"),
      email,
      phone: s.from_number,
      biz_name: str("business_name"),
      sector: str("sector"),
      form_lang: str("language") ?? s.lang,
      ref: "appel-demo",
      submitted_at: s.last_activity,
      payload: {
        source: "call",
        call_sid: s.call_sid,
        callback_time: str("callback_time"),
        summary: str("summary"),
        intent: str("intent"),
      },
    }),
  });
  if (!r.ok) console.error("lead insert failed", r.status, await r.text());
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
