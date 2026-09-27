// IO — genera el análisis en segundo plano (hasta 15 minutos).
// El navegador envía { id, ...respuestas } y luego consulta /lectura?id=...
// Requiere la variable de entorno ANTHROPIC_API_KEY en Netlify.

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { perfil } from "../../andres-carreno/assets/js/numerologia.js";
import { porRomano, porTitulo, recomendar } from "../../andres-carreno/assets/js/catalogo.js";
import { SISTEMA, datosPersona } from "../lib/prompt.mjs";
import { lecturas, limites, huella, idValido, limpiar } from "../lib/comun.mjs";

const MODELO = process.env.IO_MODELO || "claude-sonnet-5";
const LECTURAS_POR_DIA = Number(process.env.IO_LECTURAS_POR_DIA || 2);

const Analisis = z.object({
  numeros: z.array(z.object({ nombre: z.string(), valor: z.string() })),
  capitulos: z.array(
    z.object({
      etiqueta: z.string(),
      titulo: z.string(),
      parrafos: z.array(z.string()),
      frase: z.string()
    })
  ),
  libros: z.array(z.object({ numero: z.string(), titulo: z.string(), porque: z.string() }))
});

export default async (req, context) => {
  if (req.method !== "POST") return new Response("Método no permitido", { status: 405 });

  let cuerpo;
  try {
    cuerpo = await req.json();
  } catch {
    return;
  }
  const id = cuerpo.id;
  if (!idValido(id)) return;

  const store = lecturas();
  if (await store.get(id)) return; // nunca se sobreescribe una lectura existente

  const d = limpiar(cuerpo);
  const publico = { nombre: d.nombre, apodo: d.apodo, fecha: d.fecha, hora: d.hora, lugar: d.lugar, vives: d.vives, area: d.area };
  const guardar = (extra) => store.setJSON(id, { creado: Date.now(), respuestas: publico, ...extra });

  if (!d.nombre || !d.fecha || !d.patron) {
    await guardar({ estado: "error", error: "Faltan respuestas para poder leerte." });
    return;
  }

  // Un análisis gratis por persona (por conexión y por día).
  const lim = limites();
  const clave = huella(context.ip || req.headers.get("x-nf-client-connection-ip") || "anon") + "-" + new Date().toISOString().slice(0, 10);
  const usadas = Number((await lim.get(clave)) || 0);
  if (usadas >= LECTURAS_POR_DIA) {
    await guardar({ estado: "limite", error: "Ya recibiste tu lectura de hoy. IO regala un análisis por persona." });
    return;
  }
  await lim.set(clave, String(usadas + 1));
  await guardar({ estado: "pendiente" });

  const p = perfil(d);

  try {
    const client = new Anthropic();
    const r = await client.messages.parse({
      model: MODELO,
      max_tokens: 16000,
      system: SISTEMA,
      messages: [{ role: "user", content: datosPersona(d, p) }],
      output_config: { format: zodOutputFormat(Analisis) }
    });

    if (r.stop_reason === "refusal" || !r.parsed_output) {
      throw new Error("IO no pudo completar esta lectura.");
    }

    const resultado = r.parsed_output;

    // Los libros siempre deben existir en el catálogo; si no, se usa el mapa del brief.
    const respaldo = recomendar(d.area, d.herida).romanos;
    const vistos = new Set();
    resultado.libros = resultado.libros
      .map((l) => {
        const libro = porRomano(l.numero) || porTitulo(l.titulo);
        return libro ? { numero: libro.romano, titulo: libro.titulo, porque: l.porque } : null;
      })
      .filter((l) => l && !vistos.has(l.numero) && vistos.add(l.numero));
    for (const r2 of respaldo) {
      if (resultado.libros.length >= 3) break;
      if (!vistos.has(r2)) {
        vistos.add(r2);
        resultado.libros.push({ numero: r2, titulo: porRomano(r2).titulo, porque: porRomano(r2).corto + "." });
      }
    }
    resultado.libros = resultado.libros.slice(0, 3);

    await guardar({ estado: "listo", resultado, modelo: MODELO });
  } catch (e) {
    console.error("IO analizar:", e);
    await lim.set(clave, String(usadas)); // un error no cuenta como lectura
    await guardar({ estado: "error", error: "No se pudo generar el análisis. Intenta de nuevo en unos minutos." });
  }
};
