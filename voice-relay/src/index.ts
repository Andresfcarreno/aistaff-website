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
    if (url.pathname === "/health") return new Response("ok");
    if (url.pathname === "/ws" && req.headers.get("Upgrade")?.toLowerCase() === "websocket") {
      const sid = url.searchParams.get("sid") || crypto.randomUUID();
      return env.CALLS.get(env.CALLS.idFromName(sid)).fetch(req);
    }
    return new Response("AI Staff voice relay");
  },
} satisfies ExportedHandler<Env>;
