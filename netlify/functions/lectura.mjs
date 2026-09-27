// IO — devuelve el estado de una lectura: pendiente, listo, error o limite.
// GET /.netlify/functions/lectura?id=...

import { lecturas, json, idValido } from "../lib/comun.mjs";

export default async (req) => {
  if (req.method !== "GET") return new Response("Método no permitido", { status: 405 });

  const id = new URL(req.url).searchParams.get("id");
  if (!idValido(id)) return json({ estado: "error", error: "Enlace no válido." }, 400);

  const l = await lecturas().get(id, { type: "json" });
  if (!l) return json({ estado: "desconocido" }, 404);

  return json({ estado: l.estado, error: l.error, respuestas: l.respuestas, resultado: l.resultado, creado: l.creado });
};
