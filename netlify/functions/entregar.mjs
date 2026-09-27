// Guarda el correo con sus etiquetas y, si hay proveedor configurado, envía los libros.
// POST { email, tipo: "libros" | "novedades", nombre, area, camino, libros: ["V","IX","IV"], lecturaId }
//
// Variables opcionales en Netlify:
//   RESEND_API_KEY  → clave de resend.com para enviar el correo
//   EMAIL_FROM      → remitente verificado, ej. "Andrés Carreño <libros@tudominio.com>"
//   EMAIL_ADMIN     → a dónde avisar de cada correo nuevo (ej. el de Andrés)

import { correos, json, huella, idValido } from "../lib/comun.mjs";
import { porRomano } from "../../andres-carreno/assets/js/catalogo.js";

const esCorreo = (e) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i.test(e);
const esc = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export default async (req) => {
  if (req.method !== "POST") return new Response("Método no permitido", { status: 405 });

  let d;
  try {
    d = await req.json();
  } catch {
    return json({ ok: false, error: "Datos no válidos." }, 400);
  }

  const email = String(d.email || "").trim().toLowerCase().slice(0, 254);
  if (!esCorreo(email)) return json({ ok: false, error: "Ese correo no parece válido." }, 400);

  const tipo = d.tipo === "novedades" ? "novedades" : "libros";
  const libros = (Array.isArray(d.libros) ? d.libros : []).map(porRomano).filter(Boolean).slice(0, 3);
  const origen = new URL(req.url).origin;
  const base = `${origen}/andres-carreno/`;

  const store = correos();
  const clave = huella(email);
  const previo = (await store.get(clave, { type: "json" })) || { creado: Date.now(), etiquetas: [] };
  const etiquetas = new Set(previo.etiquetas);
  etiquetas.add(tipo);
  if (d.area) etiquetas.add("area:" + String(d.area).slice(0, 40));
  if (d.camino) etiquetas.add("camino:" + String(d.camino).slice(0, 4));

  await store.setJSON(clave, {
    ...previo,
    email,
    nombre: String(d.nombre || previo.nombre || "").slice(0, 80),
    area: d.area ? String(d.area).slice(0, 60) : previo.area,
    camino: d.camino ? String(d.camino).slice(0, 4) : previo.camino,
    libros: libros.length ? libros.map((l) => l.romano) : previo.libros,
    lectura: idValido(d.lecturaId) ? d.lecturaId : previo.lectura,
    etiquetas: [...etiquetas],
    actualizado: Date.now()
  });

  let enviado = false;
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (key && from) {
    const nombre = esc(String(d.nombre || "").split(" ")[0]);
    const lista = libros
      .map((l) => `<li style="margin:0 0 14px"><a href="${base}${l.pdf}" style="color:#E8C36A;font-size:17px">${esc(l.titulo)}</a><br><span style="color:#8E93A8;font-size:14px">${esc(l.corto)}</span></li>`)
      .join("");
    const html = tipo === "libros"
      ? `<div style="background:#080C1E;color:#F2EFE6;font-family:Georgia,serif;padding:40px 28px;line-height:1.7">
          <p style="font-family:monospace;letter-spacing:.3em;color:#6C7BB5;font-size:11px">IO · BIBLIOTECA ANDRÉS CARREÑO</p>
          <h1 style="font-weight:300;font-size:28px">${nombre ? nombre + ", aquí" : "Aquí"} están tus tres libros</h1>
          <p>Los elegí a partir de lo que escribiste en IO. Léelos en el orden en que aparecen.</p>
          <ol style="padding-left:20px">${lista}</ol>
          ${idValido(d.lecturaId) ? `<p><a href="${base}?lectura=${d.lecturaId}" style="color:#E8C36A">Volver a leer tu análisis</a></p>` : ""}
          <p style="color:#8E93A8;font-size:14px">— Andrés Carreño</p></div>`
      : `<div style="background:#080C1E;color:#F2EFE6;font-family:Georgia,serif;padding:40px 28px;line-height:1.7">
          <h1 style="font-weight:300;font-size:26px">Quedaste en la lista</h1>
          <p>Cada vez que publique un libro nuevo te llega directo. Mientras tanto, la biblioteca completa está aquí: <a href="${base}#biblioteca" style="color:#E8C36A">diez libros, cero costo</a>.</p>
          <p style="color:#8E93A8;font-size:14px">— Andrés Carreño</p></div>`;
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [email],
          subject: tipo === "libros" ? "Tus tres libros — IO" : "Estás en la lista — Biblioteca Andrés Carreño",
          html
        })
      });
      enviado = r.ok;
      if (process.env.EMAIL_ADMIN) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from,
            to: [process.env.EMAIL_ADMIN],
            subject: `Nuevo correo (${tipo}) · ${d.area || "sin área"}`,
            html: `<p>${esc(email)} — ${esc(d.nombre)}<br>Área: ${esc(d.area)} · Camino: ${esc(d.camino)}<br>Libros: ${libros.map((l) => l.romano).join(", ")}</p>`
          })
        });
      }
    } catch (e) {
      console.error("entregar:", e);
    }
  }

  return json({
    ok: true,
    enviado,
    libros: libros.map((l) => ({ numero: l.romano, titulo: l.titulo, url: `${base}${l.pdf}` }))
  });
};
