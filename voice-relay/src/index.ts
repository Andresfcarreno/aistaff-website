// AI Staff — servidor de voz en streaming (Twilio ConversationRelay) en Cloudflare.
// Cada llamada vive en su propio Durable Object, que mantiene el WebSocket abierto
// durante toda la llamada.

import { DurableObject } from "cloudflare:workers";
import { handleCall, type Env } from "./call";

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

      // Initial HTTP POST from Twilio: respond with TwiML that connects to WebSocket
      console.log("Twilio webhook POST - responding with TwiML");
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://aistaff-voice-relay.andycarrenofx.workers.dev/ws?sid=call-${crypto.randomUUID()}" />
  </Connect>
</Response>`;

      return new Response(twiml, {
        headers: { "Content-Type": "application/xml" },
      });
    }

    return new Response("AI Staff voice relay");
  },
} satisfies ExportedHandler<Env>;
