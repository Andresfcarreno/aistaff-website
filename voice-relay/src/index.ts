// AI Staff — servidor de voz en streaming (Twilio ConversationRelay) en Cloudflare.
// Cada llamada vive en su propio Durable Object, que mantiene el WebSocket abierto
// durante toda la llamada.

import { DurableObject } from "cloudflare:workers";
import { handleCall, type Env } from "./call";
import { GREETING } from "./prompt";

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export class CallSession extends DurableObject<Env> {
  async fetch(_req: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    handleCall(server, this.env);
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
      const wsUrl = `wss://${url.host}/ws?sid=call-${crypto.randomUUID()}`;
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay url="${esc(wsUrl)}" welcomeGreeting="${esc(GREETING)}" language="multi" transcriptionProvider="deepgram" speechModel="nova-3-general" ttsProvider="ElevenLabs" interruptible="true" />
  </Connect>
</Response>`;

      return new Response(twiml, {
        headers: { "Content-Type": "application/xml" },
      });
    }

    return new Response("AI Staff voice relay");
  },
} satisfies ExportedHandler<Env>;
