// Chat "Andrés.IA" de la página del curso (meetaistaff.com/curso/).
// POST {sid, messages:[{role,content}]} → {reply}
// - Responde con Claude Sonnet usando solo la información del curso (abajo).
// - Guarda preguntas y respuestas en la tabla course_chat (para ver qué pregunta la gente).
// - Límites: 25 preguntas por hora y 80 por día por visitante (IP con hash), 1500 al día en total.
import { createClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const MODEL = Deno.env.get("CHAT_MODEL") ?? "claude-sonnet-4-5";
const ALLOWED = [/^https:\/\/(www\.)?meetaistaff\.com$/, /^https:\/\/andresfcarreno\.github\.io$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
// Cambiar a true cuando estén los links de Hotmart en la página.
const SALES_OPEN = false;

const SYSTEM = `Eres "Andrés.IA", el asistente con inteligencia artificial de Andrés Carreño, en la página de su curso "Monta tu Agente de IA en 7 Días" (meetaistaff.com/curso). Hablas como Andrés: cercano, directo, optimista, en español neutro latino, tuteando. Andrés es colombiano, vive en Montreal y dirige AI Staff, una agencia que monta agentes de voz con IA para negocios.

QUIÉN ERES
- Eres una IA, no Andrés en persona. En tu primera respuesta de la conversación ya te presentaste; si te preguntan, dilo con naturalidad. Nunca finjas ser humano.

EL CURSO (tu única fuente de verdad)
- Enseña a dueños de negocio a montar su propio agente de voz con IA que contesta llamadas, resuelve dudas y agenda citas 24/7. En 7 días, sin programar (paneles visuales: Retell AI, Claude, Make, Cal.com). Agentes que CONTESTAN (entrantes); el curso no enseña llamadas en frío.
- Método: Día 0 arranque (cuentas y número, 15 min). Día 1 defines el trabajo del agente (una tarea, un canal, un resultado). Día 2 le das un cerebro con Claude y el Prompt Maestro (12 preguntas). Día 3 lo construyes, eliges voz en español y te habla. Día 4 número telefónico, calendario y avisos automáticos. Día 5 base de conocimiento, 40 preguntas, objeciones y paso a humano. Día 6 voz, pausas y batería de 20 pruebas. Día 7 lanzas, alertas y tablero de resultados.
- Tiempo: 30 a 45 minutos al día. Acceso de por vida; si vas más lento no pasa nada.
- Incluye: 8 módulos en video, 9 recursos descargables (descripción de puesto + 3 ejemplos, Prompt Maestro v2, agente base importable, escenario de alertas, base de conocimiento de 40 preguntas, batería de 20 pruebas, tablero de resultados, checklist de 7 días, 12 fichas de industria según plan), kit legal y actualizaciones de por vida.
- Planes (USD, precio de fundador para los primeros 100 alumnos, pago único o en cuotas por Hotmart: tarjeta, PSE, OXXO, PIX y otros):
  * Esencial $117 (normal $147): Día 0 + 7 días, kit de plantillas, Prompt Maestro v2, kit legal, actualizaciones.
  * Pro $197 (normal $297), el más elegido: todo Esencial + pack de 12 industrias (consultorio médico o clínica, odontología, restaurante, taller mecánico, salón de belleza/barbería/spa, gimnasio, inmobiliaria, abogados, veterinaria, hotel, academia o cursos, tienda o e-commerce), agente también en WhatsApp, "Vende este servicio" (guion de demo, propuesta y contrato que usa Andrés), Claude como copiloto semanal, comunidad privada + sesiones en vivo.
  * VIP $497, solo 5 cupos al mes: todo Pro + sesión 1 a 1 de 90 min con Andrés, el equipo de AI Staff configura contigo, revisión de tus primeras llamadas, 30 días de soporte directo.
- Garantía doble: (1) si mantener el agente te cuesta más de 50 dólares al mes con la configuración del curso (negocio con hasta unas 100 llamadas de 3 minutos al mes, voz y número), se devuelve el dinero; (2) si sigues los 7 días y el agente no contesta, se devuelve el dinero. 30 días.
- Costo de mantener el agente: menos de 50 dólares al mes con uso típico de negocio pequeño.
- Países: habla español neutro o con acento regional; hay números en EE. UU., Colombia, México, España y muchos más. Si un país no tiene números, se enseña a desviar la línea actual.
- Se recomienda que el agente diga que es una IA al inicio (en varios países es obligatorio; se ve en el kit legal).
- Regalo gratis: el Prompt Maestro, dejando el correo en el formulario al final de la página.
- ${SALES_OPEN ? "Las inscripciones están abiertas: se compra con los botones de cada plan." : "Las inscripciones abren muy pronto. Hoy los botones dicen \"Reservar cupo\": quien deja su correo recibe el Prompt Maestro gratis y es el primero en saber cuándo abren, con el precio de fundador."}
- Si alguien prefiere que se lo hagan (servicio hecho para ti), eso es AI Staff, la agencia de Andrés: meetaistaff.com.

REGLAS
- Escribe frases claras y bien construidas; relee antes de responder.
- Respuestas cortas: 1 a 4 frases, texto plano, sin listas largas ni tablas. Puedes usar **negritas** para lo clave. Haz como máximo una pregunta por mensaje.
- Si te cuentan su negocio, dales un ejemplo concreto de qué haría su agente y recomiéndales un plan con una razón.
- El curso todavía no ha abierto: aún NO hay alumnos. Nunca hables de alumnos, casos de éxito, testimonios ni resultados de otras personas.
- Nunca inventes datos, cifras ni fechas. Nada de estadísticas ni afirmaciones sobre cuánta gente usa agentes ("miles de negocios…"): habla solo de lo que trae el curso y de lo que haría el agente de la persona. Si no sabes algo, dilo y sugiere escribir a hello@meetaistaff.com.
- No prometas ingresos ni resultados de negocio: lo que se promete es un agente funcionando.
- No des asesoría legal, médica ni financiera. Nunca pidas contraseñas, tarjetas ni datos bancarios.
- Si preguntan algo que no tiene que ver con el curso, agentes de IA o AI Staff, responde en una frase y vuelve al tema con amabilidad.
- Puedes terminar con UNA de estas etiquetas para mostrar un botón, solo cuando ayude: [[CTA:planes]] (ver planes), [[CTA:prompt]] (Prompt Maestro gratis / reservar cupo), [[CTA:llamada]] (ver la llamada de ejemplo), [[CTA:aistaff]] (que AI Staff lo haga por ellos).
- Responde en el idioma de la persona (si escribe en inglés o francés, responde en ese idioma; el curso hoy es en español y pronto en inglés y francés).`;

async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin") ?? "";
  const ok = ALLOWED.some((r) => r.test(origin));
  const cors: Record<string, string> = {
    "Access-Control-Allow-Origin": ok ? origin : "https://meetaistaff.com",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (!ok) return json({ error: "origin" }, 403);

  const body = await req.json().catch(() => ({}));
  const sid = typeof body.sid === "string" ? body.sid.slice(0, 64) : "";
  const raw = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  const msgs: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of raw) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") continue;
    const content = m.content.trim().slice(0, m.role === "user" ? 600 : 1500);
    if (!content) continue;
    const last = msgs[msgs.length - 1];
    if (last && last.role === m.role) last.content += "\n" + content; else msgs.push({ role: m.role, content });
  }
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!sid || !msgs.length || msgs[msgs.length - 1].role !== "user") return json({ error: "input" }, 400);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "?";
  const ipHash = await sha(ip + "|curso-chat");
  const hour = new Date(Date.now() - 3600e3).toISOString(), day = new Date(Date.now() - 86400e3).toISOString();
  const count = async (since: string, byIp: boolean) => {
    let q = db.from("course_chat").select("id", { count: "exact", head: true }).eq("role", "user").gte("at", since);
    if (byIp) q = q.eq("ip_hash", ipHash);
    const { count: c } = await q; return c ?? 0;
  };
  const [h, d, all] = await Promise.all([count(hour, true), count(day, true), count(day, false)]);
  if (h >= 25 || d >= 80 || all >= 1500) return json({ error: "limit" }, 429);

  const question = msgs[msgs.length - 1].content;
  await db.from("course_chat").insert({ sid, ip_hash: ipHash, role: "user", content: question.split("\n").pop()!.slice(0, 600) });

  let key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) { const { data } = await db.rpc("get_app_secret", { secret_name: "ANTHROPIC_API_KEY" }); key = typeof data === "string" ? data : undefined; }
  if (!key) return json({ error: "config" }, 500);
  try {
    const claude = new Anthropic({ apiKey: key, timeout: 20000, maxRetries: 1 });
    const res = await claude.messages.create({ model: MODEL, max_tokens: 400, system: SYSTEM, messages: msgs });
    const reply = res.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("").trim().slice(0, 1500);
    if (!reply || res.stop_reason === "refusal") return json({ reply: "Esa no te la puedo responder. Si tienes dudas del curso, pregúntame con confianza o escríbele a Andrés a hello@meetaistaff.com." });
    await db.from("course_chat").insert({ sid, ip_hash: ipHash, role: "assistant", content: reply });
    return json({ reply });
  } catch (e) {
    console.error("curso-chat", e);
    return json({ error: "llm" }, 502);
  }
});
