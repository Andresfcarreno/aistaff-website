// Recibe SMS y WhatsApp entrantes de Twilio y los guarda en `messages` para el dashboard.
// URL en Twilio: https://<proyecto>.supabase.co/functions/v1/messages-in?k=<MSG_WEBHOOK_KEY>
import { createClient } from "npm:@supabase/supabase-js@2";

const TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
const xml = (s: string, status = 200) => new Response(s, { status, headers: { "Content-Type": "text/xml" } });

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

  const { data: tenant } = await db.from("tenants").select("id").eq("twilio_number", num(to)).maybeSingle();
  const tenant_id = tenant?.id ?? "00000000-0000-0000-0000-000000000001";

  await db.from("messages").upsert({
    tenant_id, channel, direction: "in",
    contact_name: f.get("ProfileName") || null,
    contact_handle: num(from),
    body: body || (media ? `[${media} archivo(s) adjunto(s)]` : ""),
    ext_id: f.get("MessageSid") ?? crypto.randomUUID(),
    meta: { to: num(to), media },
  }, { onConflict: "tenant_id,channel,ext_id", ignoreDuplicates: true });

  return xml(TWIML);
});
