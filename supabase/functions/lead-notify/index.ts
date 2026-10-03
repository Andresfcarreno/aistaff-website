// AI Staff — aviso de cada lead nuevo (formulario /onboarding/ o llamada a la línea demo).
//
// Lo llama cada minuto el cron `lead-notify` de Supabase (pg_net), solo cuando hay leads sin
// avisar, con la cabecera x-notify-key (secreto NOTIFY_KEY del Vault). También acepta {id}.
// Relee los leads en la base y marca cada uno con payload.notified_at cuando un canal funciona.
//
// Canales (cada uno se activa solo si sus secretos existen, en Edge Functions o en el Vault):
//   Correo (Resend): RESEND_API_KEY · opcional NOTIFY_EMAIL (por defecto hello@meetaistaff.com)
//   SMS (Twilio):    TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, NOTIFY_PHONE (+1…) · opcional NOTIFY_FROM
// Ninguna clave va en el repo.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  (JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}").default as string);

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

type Lead = {
  id: string; created_at: string; first_name: string | null; last_name: string | null; email: string | null;
  phone: string | null; biz_name: string | null; sector: string | null; city: string | null; plan: string | null;
  form_lang: string | null; ref: string | null; payload: Record<string, unknown> | null;
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function lines(l: Lead): [string, string][] {
  const p = l.payload ?? {};
  const fromCall = p.source === "call";
  const name = [l.first_name, l.last_name].filter(Boolean).join(" ");
  const rows: [string, unknown][] = [
    ["Origen", fromCall ? "Llamada a la línea demo" : `Formulario /onboarding/${l.ref ? ` (ref: ${l.ref})` : ""}`],
    ["Nombre", name],
    ["Negocio", l.biz_name],
    ["Sector", l.sector],
    ["Ciudad", l.city],
    ["Teléfono", l.phone],
    ["Correo", l.email],
    ["Plan", l.plan],
    ["Idioma", l.form_lang],
    ["Cuándo llamarle", p.callback_time],
    ["Llamadas por semana", p.callsWeek],
    ["Quién contesta hoy", p.whoAnswers],
    ["Arranque", p.startDate],
    ["Notas", p.notes],
    ["Resumen", p.summary],
  ];
  return rows
    .map(([k, v]): [string, string] => [k, Array.isArray(v) ? v.join(", ") : typeof v === "number" ? String(v) : typeof v === "string" ? v.trim() : ""])
    .filter(([, v]) => v !== "");
}

async function sendEmail(l: Lead): Promise<string> {
  const key = await secret("RESEND_API_KEY");
  if (!key) return "email: sin RESEND_API_KEY";
  const to = (await secret("NOTIFY_EMAIL")) ?? "hello@meetaistaff.com";
  const who = l.biz_name || [l.first_name, l.last_name].filter(Boolean).join(" ") || l.phone || "sin nombre";
  const rows = lines(l);
  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px">
<h2 style="color:#0A1A33;margin:0 0 12px">Nuevo lead: ${esc(who)}</h2>
<table style="border-collapse:collapse;width:100%">${rows.map(([k, v]) =>
    `<tr><td style="padding:6px 10px;color:#5b6b82;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:6px 10px">${esc(v)}</td></tr>`).join("")}</table>
<p style="color:#5b6b82;font-size:13px;margin-top:16px">Guardado en Supabase, tabla <code>leads</code> (id ${esc(l.id)}).</p></div>`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "AI Staff <leads@meetaistaff.com>",
      to: [to],
      reply_to: l.email ?? undefined,
      subject: `Nuevo lead: ${who}`,
      html,
      text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
    }),
  });
  return `email: ${r.status}${r.ok ? "" : " " + (await r.text()).slice(0, 200)}`;
}

async function sendSms(l: Lead): Promise<string> {
  const [sid, token, to] = await Promise.all([secret("TWILIO_ACCOUNT_SID"), secret("TWILIO_AUTH_TOKEN"), secret("NOTIFY_PHONE")]);
  const missing = [!sid && "TWILIO_ACCOUNT_SID", !token && "TWILIO_AUTH_TOKEN", !to && "NOTIFY_PHONE"].filter(Boolean);
  if (missing.length) return `sms: falta ${missing.join(", ")}`;
  const from = (await secret("NOTIFY_FROM")) ?? "+14388058804";
  const p = l.payload ?? {};
  const parts = [
    `AI Staff: nuevo lead (${p.source === "call" ? "llamada" : "formulario"})`,
    [l.first_name, l.last_name].filter(Boolean).join(" "),
    l.biz_name, l.sector, l.phone, l.email,
    (p.callback_time as string) ? `Llamar: ${p.callback_time}` : null,
  ].filter((x) => typeof x === "string" && x.trim());
  const body = parts.join(" · ").slice(0, 320);
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${sid}:${token}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ From: from, To: to!, Body: body }),
  });
  return `sms: ${r.status}${r.ok ? "" : " " + (await r.text()).slice(0, 200)}`;
}

// Solo se avisa de leads creados después de activar el aviso (no de las pruebas viejas).
const SINCE = "2026-10-03T00:00:00Z";

async function notify(lead: Lead): Promise<string[]> {
  const results = await Promise.all([sendEmail(lead), sendSms(lead)]);
  const ok = results.some((r) => /^(email|sms): 2\d\d/.test(r));
  // Se marca como avisado si al menos un canal funcionó; si no, el barrido lo reintenta.
  if (ok) {
    await db(`leads?id=eq.${encodeURIComponent(lead.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ payload: { ...(lead.payload ?? {}), notified_at: new Date().toISOString() } }),
    });
  }
  console.log("lead-notify", lead.id, results.join(" | "));
  return results;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("AI Staff lead-notify");
  const key = await secret("NOTIFY_KEY");
  if (!key || req.headers.get("x-notify-key") !== key) return new Response("forbidden", { status: 403 });

  const body = await req.json().catch(() => ({}));
  const week = new Date(Date.now() - 7 * 864e5).toISOString();
  const since = week > SINCE ? week : SINCE;
  const filter = typeof body.id === "string"
    ? `id=eq.${encodeURIComponent(body.id)}`
    : `created_at=gt.${since}&payload->>notified_at=is.null&order=created_at.asc&limit=10`;
  const r = await db(`leads?${filter}&select=*`);
  const leads: Lead[] = r.ok ? await r.json() : [];
  const out: Record<string, string[]> = {};
  for (const lead of leads) {
    if (lead.payload?.notified_at) continue;
    out[lead.id] = await notify(lead);
  }
  return Response.json({ notified: out });
});
