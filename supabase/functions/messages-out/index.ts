// El dueño responde a mano desde el dashboard (pestaña Messages).
// POST con el token de sesión del dashboard (Authorization: Bearer <access_token>) y
// {channel: "sms"|"whatsapp", to: "+1…", body: "…"}.
// Solo se puede escribir a un contacto que ya le escribió a ese negocio. En WhatsApp, Meta
// solo permite texto libre dentro de las 24 h siguientes al último mensaje del cliente.
// Al responder a mano, la respuesta automática se pausa 12 h para ese contacto (messages-in).
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function secret(db: ReturnType<typeof createClient>, name: string): Promise<string | null> {
  const env = Deno.env.get(name);
  if (env) return env;
  const { data } = await db.rpc("get_app_secret", { secret_name: name });
  return typeof data === "string" && data ? data : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: auth } = await db.auth.getUser(jwt);
  const email = auth?.user?.email?.toLowerCase();
  if (!email) return json({ error: "auth" }, 401);

  const { channel, to, body } = await req.json().catch(() => ({}));
  const text = typeof body === "string" ? body.trim() : "";
  if (!["sms", "whatsapp"].includes(channel) || typeof to !== "string" || !text) return json({ error: "input" }, 400);
  if (text.length > 1500) return json({ error: "too_long" }, 400);

  const { data: tenant } = await db.from("tenants").select("id,twilio_number").ilike("owner_email", email).limit(1).maybeSingle();
  if (!tenant?.twilio_number) return json({ error: "no_tenant" }, 403);

  // El contacto tiene que haberle escrito antes a este negocio.
  const { data: lastIn } = await db.from("messages").select("at")
    .eq("tenant_id", tenant.id).eq("channel", channel).eq("contact_handle", to).eq("direction", "in")
    .order("at", { ascending: false }).limit(1).maybeSingle();
  if (!lastIn) return json({ error: "unknown_contact" }, 403);
  if (channel === "whatsapp" && Date.now() - new Date(lastIn.at).getTime() > 24 * 3600e3) {
    return json({ error: "whatsapp_24h" }, 409);
  }

  const [sid, token] = await Promise.all([secret(db, "TWILIO_ACCOUNT_SID"), secret(db, "TWILIO_AUTH_TOKEN")]);
  if (!sid || !token) return json({ error: "twilio_config" }, 500);
  const pre = channel === "whatsapp" ? "whatsapp:" : "";
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${sid}:${token}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ From: pre + tenant.twilio_number, To: pre + to, Body: text }),
  });
  const out = await r.json().catch(() => ({}));
  if (!r.ok) return json({ error: "twilio", detail: String(out?.message ?? r.status).slice(0, 200) }, 502);

  await db.from("messages").insert({
    tenant_id: tenant.id, channel, direction: "out", contact_handle: to, body: text,
    ext_id: out.sid ?? crypto.randomUUID(), meta: { manual: true, by: email },
  });
  return json({ ok: true });
});
