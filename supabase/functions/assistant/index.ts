// AI Staff — la asistente dentro del dashboard (/demo/ con sesión iniciada).
//
// POST con el token de sesión del dashboard (Authorization: Bearer <access_token>) y JSON:
//   { action: "chat",    messages: [{role:"user"|"assistant", content}], lang, persona }
//   { action: "brief",   lang, persona }                → escribe el brief del día y lo guarda en `briefs`
//   { action: "email",   id, lang, persona }            → resumen del correo + 3 respuestas sugeridas
//   { action: "contact", phone, email?, name?, notes? } → guarda los datos de un contacto en `contacts`
// Acceso interno (cron, pruebas): cabecera x-notify-key (secreto NOTIFY_KEY) + { tenant_id }.
//
// La asistente contesta SOLO con los datos del negocio del usuario (llamadas, citas, agenda,
// mensajes, correos y contactos de su fila en `tenants`). No inventa nada y no ejecuta acciones:
// si le piden algo que todavía no puede hacer, lo dice.

import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = Deno.env.get("ASSISTANT_MODEL") ?? "claude-opus-5-5";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });

// deno-lint-ignore no-explicit-any
type DB = any;
// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;
const LANG: Record<string, string> = { fr: "French (Quebec)", en: "English", es: "Spanish" };
const PERSONA: Record<string, string> = { sofia: "Sofía", alex: "Alex", tomas: "Tomás" };

async function secret(db: DB, name: string): Promise<string | null> {
  const env = Deno.env.get(name);
  if (env) return env;
  const { data } = await db.rpc("get_app_secret", { secret_name: name });
  return typeof data === "string" && data ? data : null;
}

const mtl = (iso: string | null) => iso
  ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Montreal", weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso))
  : "?";
const cut = (s: unknown, n: number) => { const t = String(s ?? "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; };

// Todo lo que la asistente puede saber del negocio, en texto compacto.
async function context(db: DB, tenant: Row) {
  const now = Date.now(), ago = (d: number) => new Date(now - d * 864e5).toISOString(), ahead = (d: number) => new Date(now + d * 864e5).toISOString();
  const [calls, bookings, events, messages, emails, contacts] = await Promise.all([
    db.from("calls").select("started_at,caller_name,phone_number,summary,intent,duration_sec,language").eq("tenant_id", tenant.id)
      .gte("started_at", ago(30)).order("started_at", { ascending: false }).limit(40),
    db.from("bookings").select("contact_name,contact_phone,contact_email,booking_type,scheduled_for,status,notes,created_at").eq("tenant_id", tenant.id)
      .gte("created_at", ago(30)).order("created_at", { ascending: false }).limit(40),
    db.from("events").select("title,who,starts_at,ends_at").eq("tenant_id", tenant.id)
      .gte("starts_at", ago(1)).lte("starts_at", ahead(21)).order("starts_at").limit(60),
    db.from("messages").select("channel,direction,contact_name,contact_handle,body,at").eq("tenant_id", tenant.id)
      .gte("at", ago(14)).order("at", { ascending: false }).limit(60),
    db.from("emails").select("from_name,from_addr,subject,snippet,status,at").eq("tenant_id", tenant.id)
      .gte("at", ago(7)).order("at", { ascending: false }).limit(25),
    db.from("contacts").select("name,phone,email,notes").eq("tenant_id", tenant.id).limit(200),
  ]);
  const c: Row[] = calls.data ?? [], b: Row[] = bookings.data ?? [], e: Row[] = events.data ?? [], m: Row[] = messages.data ?? [], em: Row[] = emails.data ?? [], ct: Row[] = contacts.data ?? [];
  const day = 864e5, last24 = (iso: string | null) => iso && now - new Date(iso).getTime() < day;
  const stats = {
    calls24: c.filter((x) => last24(x.started_at) && (x.duration_sec ?? 0) > 0).length,
    calls7: c.filter((x) => x.started_at && now - new Date(x.started_at).getTime() < 7 * day && (x.duration_sec ?? 0) > 0).length,
    requested: b.filter((x) => x.status === "requested" || x.status === "pending").length,
    messages24: m.filter((x) => x.direction === "in" && last24(x.at)).length,
    emails24: em.filter((x) => last24(x.at)).length,
    upcoming: e.filter((x) => x.starts_at && new Date(x.starts_at).getTime() > now).length,
  };
  const text = [
    `Business: ${tenant.name} · plan: ${tenant.plan ?? "?"} · now (Montreal): ${mtl(new Date().toISOString())}`,
    `\nCALLS (last 30 days, newest first):`,
    ...c.map((x) => `- ${mtl(x.started_at)} · ${x.caller_name || "unknown name"} · ${x.phone_number || "hidden number"} · ${Math.round((x.duration_sec ?? 0) / 60)} min · ${x.intent ?? ""} · ${cut(x.summary, 260)}`),
    `\nAPPOINTMENT REQUESTS taken by phone (status requested = the owner still has to confirm):`,
    ...b.map((x) => `- ${x.scheduled_for ? mtl(x.scheduled_for) : "date not fixed"} · ${x.booking_type ?? ""} · ${x.contact_name ?? ""} ${x.contact_phone ?? ""} ${x.contact_email ?? ""} · ${x.status} · ${cut(x.notes, 160)}`),
    `\nCALENDAR (next 3 weeks):`,
    ...e.map((x) => `- ${mtl(x.starts_at)} · ${cut(x.title, 80)} · ${x.who ?? ""}`),
    `\nTEXT MESSAGES (SMS/WhatsApp, last 14 days, newest first; in = from the customer, out = sent):`,
    ...m.map((x) => `- ${mtl(x.at)} · ${x.channel} · ${x.direction} · ${x.contact_name || x.contact_handle} · ${cut(x.body, 200)}`),
    `\nEMAILS (last 7 days, newest first):`,
    ...em.map((x) => `- ${mtl(x.at)} · ${x.from_name || x.from_addr} <${x.from_addr ?? ""}> · ${cut(x.subject, 100)} · ${cut(x.snippet, 200)} · ${x.status ?? ""}`),
    `\nSAVED CONTACTS:`,
    ...ct.map((x) => `- ${x.name ?? ""} · ${x.phone ?? ""} · ${x.email ?? ""} · ${cut(x.notes, 120)}`),
  ].join("\n");
  return { text, stats };
}

const RULES = (persona: string, lang: string, owner: string) => `You are ${persona}, the AI assistant of this business, built by AI Staff. You are talking with the business owner${owner ? ` (${owner})` : ""} inside their private dashboard.

Answer in ${LANG[lang] ?? "French (Quebec)"} unless the owner writes in another language; then use theirs.

RULES
- Use ONLY the business data below. Never invent calls, appointments, customers, numbers or messages. If something is not in the data, say so plainly.
- "requested" appointments are requests the assistant took by phone: the owner still has to confirm them. Say so when relevant.
- Be brief and concrete: short sentences, times and names first. Plain text; a few "•" bullet lines are fine for lists. No markdown headers, no bold.
- You cannot yet send messages, book, move or cancel appointments from this chat. If asked, say it is rolled out in phases and point to the right tab (Messages, Agenda, Courriel) or offer a draft the owner can copy.
- Never claim legal compliance. Never give legal, medical, financial or real estate brokerage advice.`;

let anthropic: Anthropic | null = null;
async function ask(db: DB, system: string, messages: { role: "user" | "assistant"; content: string }[], schema?: Record<string, unknown>, maxTokens = 1200) {
  if (!anthropic) {
    const key = await secret(db, "ANTHROPIC_API_KEY");
    if (!key) throw new Error("ANTHROPIC_API_KEY missing");
    anthropic = new Anthropic({ apiKey: key, timeout: 60_000, maxRetries: 1 });
  }
  const res = await anthropic.beta.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages,
    output_config: schema ? { effort: "low", format: { type: "json_schema", schema } } : { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });
  if (res.stop_reason === "refusal") throw new Error("refusal");
  return res.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const body = await req.json().catch(() => ({}));
  // Acceso interno (cron o pruebas desde la base): cabecera x-notify-key + tenant_id.
  const sysKey = req.headers.get("x-notify-key");
  let tenant: Row | null = null;
  if (sysKey) {
    if (sysKey !== (await secret(db, "NOTIFY_KEY")) || typeof body.tenant_id !== "string") return json({ error: "auth" }, 401);
    ({ data: tenant } = await db.from("tenants").select("id,name,plan,persona").eq("id", body.tenant_id).maybeSingle());
  } else {
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: auth } = await db.auth.getUser(jwt);
    const email = auth?.user?.email?.toLowerCase();
    if (!email) return json({ error: "auth" }, 401);
    ({ data: tenant } = await db.from("tenants").select("id,name,plan,persona").ilike("owner_email", email).limit(1).maybeSingle());
  }
  if (!tenant) return json({ error: "no_tenant" }, 403);

  const lang = ["fr", "en", "es"].includes(body.lang) ? body.lang : "fr";
  const persona = PERSONA[body.persona] ?? PERSONA[tenant.persona ?? ""] ?? "Sofía";
  const owner = typeof body.owner === "string" ? cut(body.owner, 40) : "";

  try {
    if (body.action === "contact") {
      const phone = typeof body.phone === "string" ? body.phone.trim() : "";
      if (!phone) return json({ error: "input" }, 400);
      const row = { tenant_id: tenant.id, phone, email: cut(body.email, 120) || null, name: cut(body.name, 80) || null, notes: cut(body.notes, 500) || null, updated_at: new Date().toISOString() };
      const { error } = await db.from("contacts").upsert(row, { onConflict: "tenant_id,phone" });
      if (error) return json({ error: "db", detail: error.message }, 500);
      return json({ ok: true });
    }

    const ctx = await context(db, tenant);
    const system = `${RULES(persona, lang, owner)}\n\nBUSINESS DATA\n${ctx.text}`;

    if (body.action === "chat") {
      const msgs = (Array.isArray(body.messages) ? body.messages : [])
        .filter((m: { role?: string; content?: unknown }) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
        .slice(-12).map((m: { role: "user" | "assistant"; content: string }) => ({ role: m.role, content: cut(m.content, 2000) }));
      if (!msgs.length || msgs[msgs.length - 1].role !== "user") return json({ error: "input" }, 400);
      while (msgs[0].role !== "user") msgs.shift();
      return json({ text: await ask(db, system, msgs) });
    }

    if (body.action === "brief") {
      const text = await ask(db, system, [{ role: "user", content:
        `Write my brief for right now, to be read aloud by you. 3 to 6 short spoken sentences, no bullets, no emojis: greet me${owner ? " by my first name" : ""}, then what happened in the last 24 hours (calls answered and the notable ones, who wants what), appointment requests waiting for my confirmation, messages or emails that need my answer, what is on my calendar today and tomorrow, and end with the single most useful next step. If almost nothing happened, say it in one or two sentences.` }], undefined, 700);
      const { data: saved } = await db.from("briefs").insert({ tenant_id: tenant.id, lang, text, stats: ctx.stats }).select("id,created_at").single();
      return json({ text, stats: ctx.stats, id: saved?.id ?? null, created_at: saved?.created_at ?? new Date().toISOString() });
    }

    if (body.action === "email") {
      const { data: mail } = await db.from("emails").select("from_name,from_addr,subject,snippet,at").eq("tenant_id", tenant.id).eq("id", body.id).maybeSingle();
      if (!mail) return json({ error: "not_found" }, 404);
      const out = await ask(db, RULES(persona, lang, owner), [{ role: "user", content:
        `Email received ${mtl(mail.at)} from ${mail.from_name || ""} <${mail.from_addr || ""}>.\nSubject: ${mail.subject}\nText (may be truncated): ${mail.snippet}\n\nGive: summary (1 or 2 sentences for the owner), action (the next step in a few words), replies (exactly 3 short reply drafts the owner could send, in the email's language, each 1 to 3 sentences, polite, no invented facts or commitments). If it is a newsletter, notification or spam, say so in the summary and make the replies minimal.` }],
        { type: "object", additionalProperties: false, required: ["summary", "action", "replies"], properties: { summary: { type: "string" }, action: { type: "string" }, replies: { type: "array", items: { type: "string" } } } }, 900);
      return json(JSON.parse(out));
    }

    return json({ error: "action" }, 400);
  } catch (e) {
    console.error("assistant error", e);
    return json({ error: "ai", detail: String(e).slice(0, 200) }, 502);
  }
});
