// Recibe SMS y WhatsApp entrantes de Twilio, los guarda en `messages` para el dashboard
// y, si el número tiene la respuesta automática activa (`tenants.auto_reply`), contesta
// con la asistente (Claude) en la misma conversación.
// URL en Twilio: https://<proyecto>.supabase.co/functions/v1/messages-in?k=<MSG_WEBHOOK_KEY>
//
// La asistente NO contesta cuando:
// - el mensaje parece automático (códigos de verificación, remitentes cortos);
// - el dueño respondió a mano a ese contacto en las últimas 12 horas (tomó la conversación);
// - ya mandó 15 respuestas automáticas a ese contacto en 24 horas (freno de costo);
// - el mensaje es STOP/ARRET/BAJA o similar (Twilio gestiona la baja de SMS).
// Si la persona pide hablar con un humano, la asistente lo dice y se avisa por SMS al dueño.
import { createClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const DEMO_TENANT = "00000000-0000-0000-0000-000000000001";
const MODEL = Deno.env.get("TEXT_MODEL") ?? "claude-haiku-4-5";
const xml = (s: string) => new Response(s, { headers: { "Content-Type": "text/xml" } });
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const twiml = (reply?: string) =>
  xml(`<?xml version="1.0" encoding="UTF-8"?><Response>${reply ? `<Message>${esc(reply)}</Message>` : ""}</Response>`);

type Tenant = {
  id: string; name: string; business_info: string | null; twilio_number: string | null;
  notify_phone: string | null; auto_reply: boolean | null;
};

// ---------------------------------------------------------------- guiones de texto
const DEMO_TEXT = `You are Sofía, the AI assistant of AI Staff (always written "AI Staff"), a Montreal company. You are answering text messages (SMS or WhatsApp) sent to AI Staff's own number. AI Staff gives small businesses an AI assistant that answers their calls and messages 24/7 in French, English and Spanish, takes messages and appointment requests, and reports to the owner (in Spanish if they want).

Goal: help the person, and invite business owners to CALL this same number (438-805-8804) and tell you their business name: on the call you become their receptionist live, which is the best demo. They can also fill the short form at meetaistaff.com/onboarding.

Prices if asked (CAD per month, plus taxes, month to month, no contract): Essentiel 397 $, Pro 597 $, Complet 797 $. WhatsApp, Instagram, Facebook and scheduled calls are rolled out in phases; never promise dates.

Rules:
- Reply in the language of the person's last message (French, English or Spanish). Warm, short: 1 to 3 sentences, plain text, no markdown, no emojis except at most one.
- In your FIRST reply of a conversation, say you are an AI assistant.
- Never invent clients, statistics, results or features. Never claim legal compliance. No legal, medical, financial or real estate brokerage advice.
- Never ask for passwords, card numbers or bank details.
- If the person asks for a human, or wants to talk to Andrés, say the team will contact them soon and add the tag [[HUMAN]] at the very end.
- If it is spam or a wrong number, reply politely in one sentence.`;

function clientText(t: Tenant): string {
  return `You are the AI assistant of "${t.name}", a business in the Montreal area. You answer the text messages (SMS or WhatsApp) its customers send to the business number.

BUSINESS INFORMATION (your only source of truth):
"""
${t.business_info?.trim()}
"""

Rules:
- Reply in the language of the customer's last message (French, English or Spanish). Warm and short: 1 to 3 sentences, plain text, no markdown.
- In your FIRST reply of a conversation, say you are the business's AI assistant.
- Use ONLY the business information. Never invent prices, hours, services, availability or policies. If the answer is not there, say you will pass the question to the team.
- Appointments and quotes: you cannot see the real calendar. Ask what they need, their preferred day and time and their name, then say the team will confirm. Never say an appointment is confirmed.
- Emergencies: tell them to call 911.
- Never give medical, legal, financial or real estate brokerage advice. Never ask for passwords, card numbers or bank details.
- Do not talk about AI Staff unless asked who provides the assistant ("AI Staff, meetaistaff.com").
- If the customer asks for a person, or the matter needs the owner, say the team will contact them soon and add the tag [[HUMAN]] at the very end.`;
}

// ---------------------------------------------------------------- utilidades
async function secret(db: ReturnType<typeof createClient>, name: string): Promise<string | null> {
  const env = Deno.env.get(name);
  if (env) return env;
  const { data } = await db.rpc("get_app_secret", { secret_name: name });
  return typeof data === "string" && data ? data : null;
}

const looksAutomated = (from: string, body: string) =>
  from.replace(/\D/g, "").length < 10 ||
  /\b(code|código|codigo|verification|vérification|otp|passcode)\b[^\n]{0,40}\d{3,}/i.test(body) ||
  /\d{3}[- ]?\d{3}\b[^\n]{0,60}(don't share|no lo compartas|ne le partagez)/i.test(body);
const isOptOut = (body: string) => /^\s*(stop|stopall|unsubscribe|cancel|end|quit|arr[eê]t|arreter|baja|alto)\s*$/i.test(body);

async function sendSms(db: ReturnType<typeof createClient>, from: string, to: string, body: string) {
  const [sid, token] = await Promise.all([secret(db, "TWILIO_ACCOUNT_SID"), secret(db, "TWILIO_AUTH_TOKEN")]);
  if (!sid || !token) return;
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${sid}:${token}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ From: from, To: to, Body: body.slice(0, 600) }),
  }).catch((e) => console.error("owner sms failed", e));
}

// ---------------------------------------------------------------- handler
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const k = new URL(req.url).searchParams.get("k") ?? "";
  const { data: key } = await db.rpc("get_app_secret", { secret_name: "MSG_WEBHOOK_KEY" });
  if (!key || k !== key) return new Response("forbidden", { status: 403 });

  const f = new URLSearchParams(await req.text());
  const from = f.get("From") ?? "", to = f.get("To") ?? "";
  const channel = from.startsWith("whatsapp:") ? "whatsapp" : "sms";
  const num = (s: string) => s.replace(/^whatsapp:/, "");
  const body = f.get("Body") ?? "";
  const media = Number(f.get("NumMedia") ?? "0");
  const sidIn = f.get("MessageSid") ?? crypto.randomUUID();

  const { data: tenantRow } = await db.from("tenants")
    .select("id,name,business_info,twilio_number,notify_phone,auto_reply")
    .eq("twilio_number", num(to)).maybeSingle();
  const tenant = tenantRow as Tenant | null;
  const tenant_id = tenant?.id ?? DEMO_TENANT;
  const contact = num(from);

  await db.from("messages").upsert({
    tenant_id, channel, direction: "in",
    contact_name: f.get("ProfileName") || null,
    contact_handle: contact,
    body: body || (media ? `[${media} archivo(s) adjunto(s)]` : ""),
    ext_id: sidIn,
    meta: { to: num(to), media },
  }, { onConflict: "tenant_id,channel,ext_id", ignoreDuplicates: true });

  // ¿Contesta la asistente?
  try {
    const isClient = !!tenant && tenant.id !== DEMO_TENANT && !!tenant.business_info?.trim();
    const enabled = tenant ? tenant.auto_reply !== false : true;
    if (!enabled || !body.trim() || isOptOut(body) || looksAutomated(contact, body)) return twiml();
    if (tenant && tenant.id !== DEMO_TENANT && !isClient) return twiml(); // cliente sin guion todavía

    const since12h = new Date(Date.now() - 12 * 3600e3).toISOString();
    const since24h = new Date(Date.now() - 24 * 3600e3).toISOString();
    const { data: recent } = await db.from("messages")
      .select("direction,body,at,meta")
      .eq("tenant_id", tenant_id).eq("channel", channel).eq("contact_handle", contact)
      .order("at", { ascending: false }).limit(30);
    const rows = (recent ?? []) as { direction: string; body: string | null; at: string; meta: Record<string, unknown> | null }[];
    if (rows.some((r) => r.direction === "out" && r.meta?.manual && r.at > since12h)) return twiml(); // el dueño tomó la conversación
    if (rows.filter((r) => r.direction === "out" && r.meta?.auto && r.at > since24h).length >= 15) return twiml();

    // Historial (más viejo primero), alternando roles como pide la API.
    const history: { role: "user" | "assistant"; content: string }[] = [];
    for (const r of rows.slice(0, 20).reverse()) {
      const role = r.direction === "out" ? "assistant" : "user";
      const text = (r.body ?? "").trim();
      if (!text) continue;
      const last = history[history.length - 1];
      if (last && last.role === role) last.content += "\n" + text;
      else history.push({ role, content: text });
    }
    while (history.length && history[0].role !== "user") history.shift();
    if (!history.length || history[history.length - 1].role !== "user") return twiml();

    const apiKey = await secret(db, "ANTHROPIC_API_KEY");
    if (!apiKey) return twiml();
    const claude = new Anthropic({ apiKey, timeout: 11000, maxRetries: 0 });
    const res = await claude.messages.create({
      model: MODEL,
      max_tokens: 300,
      system: (isClient ? clientText(tenant!) : DEMO_TEXT) +
        `\n\nChannel: ${channel === "whatsapp" ? "WhatsApp" : "SMS"}. Keep SMS replies under 300 characters.`,
      messages: history,
    });
    if (res.stop_reason === "refusal") return twiml();
    let reply = res.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("").trim();
    const human = /\[\[HUMAN\]\]/i.test(reply);
    reply = reply.replace(/\[\[HUMAN\]\]/gi, "").trim().slice(0, 1200);
    if (!reply) return twiml();

    await db.from("messages").insert({
      tenant_id, channel, direction: "out", contact_handle: contact,
      body: reply, ext_id: "auto-" + sidIn, meta: { auto: true, to: contact },
    });

    if (human) {
      const owner = isClient ? tenant!.notify_phone : await secret(db, "NOTIFY_PHONE");
      const ownFrom = tenant?.twilio_number ?? num(to);
      if (owner) await sendSms(db, ownFrom, owner, `${isClient ? tenant!.name : "AI Staff"}: ${contact} quiere hablar con una persona (${channel}). Último mensaje: "${body.slice(0, 200)}"`);
    }
    return twiml(reply);
  } catch (e) {
    console.error("auto-reply failed", e);
    return twiml();
  }
});
