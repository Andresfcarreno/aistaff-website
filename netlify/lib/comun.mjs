// Utilidades compartidas por las funciones de IO.

import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

export const lecturas = () => getStore("io-lecturas");
export const limites = () => getStore("io-limites");
export const correos = () => getStore("biblioteca-correos");

export const json = (cuerpo, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });

export const idValido = (id) => /^[a-f0-9-]{32,40}$/i.test(String(id || ""));

export const huella = (texto) =>
  createHash("sha256").update(String(texto) + (process.env.IO_SAL || "io-andres-carreno")).digest("hex").slice(0, 32);

// Recorta y limpia lo que llega del navegador.
export function limpiar(d) {
  const t = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
  return {
    nombre: t(d.nombre, 140),
    apodo: t(d.apodo, 80),
    fecha: t(d.fecha, 10),
    hora: t(d.hora, 20),
    lugar: t(d.lugar, 120),
    vives: t(d.vives, 120),
    padre: t(d.padre, 140),
    madre: t(d.madre, 140),
    area: t(d.area, 60),
    patron: t(d.patron, 2500),
    herida: t(d.herida, 2500)
  };
}
