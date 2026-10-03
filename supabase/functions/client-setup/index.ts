// AI Staff — alta de un cliente a partir de su formulario /onboarding/ (fila de `leads`).
//
// POST con cabecera x-notify-key (secreto NOTIFY_KEY del Vault) y cuerpo JSON:
//   { "lead_id": "…", "twilio_number": "+1514…", "notify_phone": "+1…" (opcional: el teléfono
//     del formulario), "plan": "essentiel|pro|complet" (opcional), "dry_run": true (opcional),
//     "replace": true (opcional: rehace el guion de un cliente que ya tiene ese número) }
//
// Claude escribe el guion del negocio (business_info) y el saludo SOLO con lo que el dueño
// respondió en el formulario, y se crea la fila en `tenants`. Desde ese momento, quien llame al
// número de Twilio oye a la asistente de ese negocio (función `voice` + Worker `voice-relay`).
// Con dry_run se devuelve el borrador sin guardar nada.

import Anthropic from "npm:@anthropic-ai/sdk";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  (JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}").default as string);
const MODEL = Deno.env.get("SETUP_MODEL") ?? "claude-opus-5-5";

function db(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("apikey", SERVICE_KEY);
  if (SERVICE_KEY.startsWith("eyJ")) headers.set("Authorization", `Bearer ${SERVICE_KEY}`);
  headers.set("Content-Type", "application/json");
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers });
}

async function secret(name: string): Promise<string | null> {
  const env = Deno.env.get(name);
  if (env) return env;
  const r = await db("rpc/get_app_secret", { method: "POST", body: JSON.stringify({ secret_name: name }) });
  if (!r.ok) return null;
  const v = await r.json();
  return typeof v === "string" && v ? v : null;
}

// Número norteamericano a formato E.164 (+1XXXXXXXXXX). Devuelve null si no se reconoce.
function e164(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const d = v.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return null;
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["business_info", "greeting", "report_lang", "missing"],
  properties: {
    business_info: { type: "string" },
    greeting: { type: "string" },
    report_lang: { type: "string", enum: ["es", "fr", "en"] },
    missing: { type: "array", items: { type: "string" } },
  },
};

const INSTRUCTIONS = `You prepare the phone script of a new AI Staff client. AI Staff gives a business an AI phone assistant that answers its calls in French, English and Spanish, takes messages and appointment requests, and never confirms anything itself.

Below are the owner's answers to the onboarding form (JSON). Write:

1. business_info: the knowledge sheet the phone assistant will use as its ONLY source of truth about this business. Plain text, short labelled lines, written in Spanish so the AI Staff team can review it (the assistant translates when it speaks). Include, when the form has them: what the business does, area or address, opening hours, services, how to handle prices (if the form gives no prices, write that prices are never given and a quote is offered), frequent questions with their answers, what to ask when someone wants an appointment or a quote, urgent cases and the number to give for them, what the assistant must never say or do, and the tone. Use ONLY facts from the form: never invent hours, prices, services, names, addresses or policies. Keep the owner's wording for facts. Keep it under 2500 characters.
2. greeting: what the assistant says when it picks up, in Quebec French: the business name, that it is the virtual assistant, that the call is transcribed, and a short question. If the owner wrote a greeting, adapt it (keep the transcription notice). If English or Spanish callers are expected (see langs), end with "I also speak English." and/or "También hablo español.". At most 3 short sentences.
3. report_lang: the language the owner prefers for their call summaries (from prefLang or formLang; "es" if unclear).
4. missing: up to 6 short items, in Spanish, of information the team should still ask the owner before going live (for example hours or services if the form left them empty). Empty array if nothing important is missing.

Never include passwords, card numbers or other secrets even if they appear in the form.`;

async function draft(p: Record<string, unknown>) {
  const apiKey = await secret("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");
  const client = new Anthropic({ apiKey, timeout: 120_000, maxRetries: 1 });
  // Solo las respuestas útiles para el guion (sin datos técnicos ni de consentimiento).
  const skip = new Set(["c1", "c2", "c3", "page", "submittedAt", "notified_at", "source", "ref"]);
  const form = Object.fromEntries(Object.entries(p).filter(([k, v]) => !skip.has(k) && v !== "" && v != null));
  const res = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: INSTRUCTIONS,
    messages: [{ role: "user", content: `Onboarding form answers:\n${JSON.stringify(form, null, 2)}` }],
  });
  if (res.stop_reason === "refusal") throw new Error("refusal");
  const text = res.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
  return JSON.parse(text) as { business_info: string; greeting: string; report_lang: string; missing: string[] };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("AI Staff client-setup");
  const key = await secret("NOTIFY_KEY");
  if (!key || req.headers.get("x-notify-key") !== key) return new Response("forbidden", { status: 403 });

  const body = await req.json().catch(() => ({}));
  const twilio = e164(body.twilio_number);
  if (typeof body.lead_id !== "string") return Response.json({ error: "lead_id requerido" }, { status: 400 });
  if (!twilio && !body.dry_run) return Response.json({ error: "twilio_number requerido (+1…)" }, { status: 400 });

  const r = await db(`leads?id=eq.${encodeURIComponent(body.lead_id)}&select=*`);
  const lead = r.ok ? (await r.json())[0] : undefined;
  if (!lead) return Response.json({ error: "lead no encontrado" }, { status: 404 });
  const p: Record<string, unknown> = lead.payload ?? {};
  const name = (lead.biz_name ?? p.bizName ?? "").toString().trim();
  if (!name || !lead.email) return Response.json({ error: "el lead no tiene nombre de negocio o correo" }, { status: 422 });

  if (twilio && !body.replace) {
    const taken = await db(`tenants?twilio_number=eq.${encodeURIComponent(twilio)}&select=id,name`);
    const rows = taken.ok ? await taken.json() : [];
    if (rows.length) return Response.json({ error: `el número ya es de "${rows[0].name}" (usa replace: true para rehacer su guion)` }, { status: 409 });
  }

  let d;
  try {
    d = await draft({ ...p, bizName: name, email: undefined, phone: undefined });
  } catch (e) {
    console.error("draft failed", e);
    return Response.json({ error: "no se pudo escribir el guion", detail: String(e) }, { status: 502 });
  }

  const row = {
    name,
    owner_email: String(lead.email).toLowerCase(),
    twilio_number: twilio,
    notify_phone: e164(body.notify_phone) ?? e164(lead.phone) ?? e164(p.phone),
    report_lang: d.report_lang,
    lang: "fr",
    plan: typeof body.plan === "string" ? body.plan : (lead.plan ?? "essentiel"),
    persona: typeof p.persona === "string" ? p.persona : "sofia",
    business_info: d.business_info,
    greeting: d.greeting,
  };
  if (body.dry_run) return Response.json({ dry_run: true, tenant: row, missing: d.missing });

  const ins = await db(body.replace ? "tenants?on_conflict=twilio_number" : "tenants", {
    method: "POST",
    headers: { Prefer: `return=representation${body.replace ? ",resolution=merge-duplicates" : ""}` },
    body: JSON.stringify(row),
  });
  if (!ins.ok) return Response.json({ error: "no se pudo crear el cliente", detail: (await ins.text()).slice(0, 300) }, { status: 500 });
  const tenant = (await ins.json())[0];

  await db(`leads?id=eq.${encodeURIComponent(lead.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ status: "client", payload: { ...p, tenant_id: tenant.id } }),
  });
  console.log("client-setup", lead.id, tenant.id, twilio);
  return Response.json({ tenant, missing: d.missing });
});
