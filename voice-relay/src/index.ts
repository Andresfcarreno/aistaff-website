// AI Staff — servidor de voz en streaming (Twilio ConversationRelay) en Cloudflare.
// Cada llamada vive en su propio Durable Object, que mantiene el WebSocket abierto
// durante toda la llamada.

import { DurableObject } from "cloudflare:workers";
import { handleCall, loadTenant, type Env } from "./call";
import { GREETING, clientGreeting, isClient } from "./prompt";

// Voz femenina de ElevenLabs (Sarah) con el modelo multilingüe rápido: velocidad_estabilidad_similitud.
// Para cambiarla: reemplaza el ID por el de otra voz de ElevenLabs.
// Ana Sofía (ElevenLabs, español mexicano neutro, conversacional) + modelo multilingüe rápido.
// Alternativas mexicanas si se quiere cambiar: Regina 9Godp7dNohUvXk6qp0gS, Ana María m7yTemJqdIqrcNleANfX.
const VOICE = "ewn5JTa3lNPY8QVuZJi6-flash_v2_5-1.0_0.5_0.8";

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export class CallSession extends DurableObject<Env> {
  async fetch(req: Request): Promise<Response> {
    const tenantId = new URL(req.url).searchParams.get("t");
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    handleCall(server, this.env, tenantId);
    return new Response(null, { status: 101, webSocket: client });
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    console.log(`Request: ${req.method} ${url.pathname}`);

    if (url.pathname === "/health") return new Response("ok");

    // Handle both /ws and / (root) for Twilio webhook
    if (url.pathname === "/ws" || url.pathname === "/") {
      // Twilio Conversational AI uses WebSocket for audio streaming
      if (req.headers.get("Upgrade")?.toLowerCase() === "websocket") {
        console.log("WebSocket upgrade request received");
        const sid = url.searchParams.get("sid") || crypto.randomUUID();
        return env.CALLS.get(env.CALLS.idFromName(sid)).fetch(req);
      }

      // Llamada entrante de Twilio: TwiML de ConversationRelay (STT + TTS los maneja Twilio;
      // este worker solo recibe texto y responde texto por WebSocket).
      console.log("Twilio webhook - responding with ConversationRelay TwiML");
      // ¿El número llamado es de un cliente? Entonces su saludo y su guion.
      let greeting = GREETING;
      let t = "";
      const form = req.method === "POST" ? await req.formData().catch(() => null) : null;
      const to = form?.get("To");
      if (typeof to === "string" && to) {
        const tenant = await loadTenant(env, { number: to });
        if (isClient(tenant)) {
          greeting = clientGreeting(tenant);
          t = `&t=${encodeURIComponent(tenant.id)}`;
        }
      }
      const wsUrl = `wss://${url.host}/ws?sid=call-${crypto.randomUUID()}${t}`;
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay url="${esc(wsUrl)}" welcomeGreeting="${esc(greeting)}" language="multi" transcriptionProvider="deepgram" speechModel="nova-3-general" ttsProvider="ElevenLabs" voice="${VOICE}" interruptible="true" />
  </Connect>
</Response>`;

      return new Response(twiml, {
        headers: { "Content-Type": "application/xml" },
      });
    }

    return new Response("AI Staff voice relay");
  },
} satisfies ExportedHandler<Env>;
