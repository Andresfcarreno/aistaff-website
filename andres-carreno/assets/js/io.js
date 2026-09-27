// IO — la experiencia completa, dentro de la misma página.
// Once preguntas → constelación → análisis → tus tres libros → correo.

import { letras, valorLetra, esVocal, perfil, destino } from "./numerologia.js";
import { LIBROS, AREAS, porRomano } from "./catalogo.js";
import { lecturaLocal, SIGNIFICADOS } from "./lectura-local.js";

const API = {
  analizar: "/.netlify/functions/analizar-background",
  lectura: "/.netlify/functions/lectura",
  entregar: "/.netlify/functions/entregar"
};
const CLAVE_LECTURA = "io-lectura";
const CLAVE_BORRADOR = "io-borrador";
const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const $ = (id) => document.getElementById(id);
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const leer = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } };
const borrar = (k) => { try { localStorage.removeItem(k); } catch {} };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/* =========================================================
   LAS ONCE PREGUNTAS
   ========================================================= */
const Q = [
  { k: "nombre", tipo: "texto", vivo: true, q: "¿Cómo te llamas?", nota: "Tu nombre completo, como aparece en tu registro de nacimiento. Los apellidos también cuentan.", ph: "Nombre y apellidos" },
  { k: "apodo", tipo: "texto", vivo: true, q: "¿Y cómo te llama la gente que te quiere?", nota: "El nombre con el que vives todos los días. A veces vibra distinto al del papel.", ph: "Como te dicen", saltar: "Me dicen igual" },
  { k: "fecha", tipo: "fecha", q: "¿Qué día llegaste?", nota: "Tu fecha de nacimiento." },
  { k: "hora", tipo: "hora", q: "¿A qué hora?", nota: "La hora define tu ascendente — cómo te ve el mundo antes de conocerte. Si no la sabes, seguimos igual.", saltar: "No la sé" },
  { k: "lugar", tipo: "texto", q: "¿Dónde naciste?", nota: "Ciudad y país.", ph: "Ciudad, país" },
  { k: "vives", tipo: "texto", q: "¿Y dónde vives ahora?", nota: "El lugar donde estás también te está haciendo algo. Esto lo lee la astrocartografía.", ph: "Ciudad, país" },
  { k: "padre", tipo: "texto", vivo: true, q: "¿Cómo se llama tu papá?", nota: "El nombre completo si lo sabes. Mucho de lo que cargas viene por esta línea.", ph: "Nombre completo", saltar: "Prefiero no decirlo" },
  { k: "madre", tipo: "texto", vivo: true, q: "¿Y tu mamá?", nota: "Nombre completo.", ph: "Nombre completo", saltar: "Prefiero no decirlo" },
  { k: "area", tipo: "opcion", q: "¿Qué parte de tu vida se siente trabada?", nota: "Elige la que más pesa hoy." },
  { k: "patron", tipo: "largo", clave: "El patrón", q: "¿Qué se te repite y no entiendes por qué?", nota: "Una situación, un tipo de persona, una forma de terminar las cosas. Escríbelo como te salga.", ph: "Lo que se me repite es..." },
  { k: "herida", tipo: "largo", clave: "La raíz", q: "¿Qué te dijeron de niño que todavía cargas?", nota: "Una frase, una etiqueta, algo que escuchaste sobre ti y que no se te ha borrado. Esta es la pregunta que llega a la raíz.", ph: "Me decían que...", saltar: "Paso esta" }
];

/* =========================================================
   EL CAMPO — cada respuesta enciende una estrella
   ========================================================= */
function crearCampo(cv) {
  const ctx = cv.getContext("2d");
  let W, H, dpr, polvo = [], estrellas = [], raton = { x: -9999, y: -9999 }, activo = false, reunir = 0, tenue = 1, tenueMeta = 1;

  function medir() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.width = innerWidth * dpr;
    H = cv.height = innerHeight * dpr;
    const n = innerWidth < 640 ? 46 : 90;
    polvo = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.12 * dpr, vy: (Math.random() - 0.5) * 0.12 * dpr,
      r: (Math.random() * 1.5 + 0.5) * dpr, a: Math.random() * 0.4 + 0.12, f: Math.random() * 6.28
    }));
    estrellas.forEach((s) => { s.x = s.ux * W; s.y = s.uy * H; });
  }
  addEventListener("resize", () => activo && medir());
  addEventListener("pointermove", (e) => { raton.x = e.clientX * dpr; raton.y = e.clientY * dpr; }, { passive: true });

  function pintar() {
    if (!activo) return;
    requestAnimationFrame(pintar);
    ctx.clearRect(0, 0, W, H);
    for (const p of polvo) {
      if (!quieto) {
        p.x += p.vx; p.y += p.vy; p.f += 0.012;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      }
      const dx = p.x - raton.x, dy = p.y - raton.y, d2 = dx * dx + dy * dy, rad = 140 * dpr;
      let ox = 0, oy = 0;
      if (d2 < rad * rad) { const d = Math.sqrt(d2) || 1, f = (1 - d / rad) * 24 * dpr; ox = (dx / d) * f; oy = (dy / d) * f; }
      const tw = quieto ? 1 : Math.sin(p.f) * 0.3 + 0.7;
      ctx.beginPath(); ctx.arc(p.x + ox, p.y + oy, p.r, 0, 6.284);
      ctx.fillStyle = "rgba(160,175,225," + p.a * tw + ")"; ctx.fill();
    }
    reunir += ((estrellas.reunir ? 1 : 0) - reunir) * 0.03;
    tenue += (tenueMeta - tenue) * 0.04;
    const cx = W / 2, cy = H * 0.36;
    ctx.lineWidth = 0.7 * dpr;
    for (let i = 0; i < estrellas.length; i++) {
      const s = estrellas[i];
      s.r += (s.meta - s.r) * 0.07; s.brillo += (1 - s.brillo) * 0.05;
      const ang = (i / Math.max(1, estrellas.length)) * 6.283 + performance.now() / 3000;
      const rr = Math.min(W, H) * 0.13;
      s.dx = s.x + (cx + Math.cos(ang) * rr - s.x) * reunir;
      s.dy = s.y + (cy + Math.sin(ang) * rr - s.y) * reunir;
      if (i > 0) {
        const p = estrellas[i - 1];
        ctx.beginPath(); ctx.moveTo(p.dx, p.dy); ctx.lineTo(s.dx, s.dy);
        ctx.strokeStyle = "rgba(232,195,106," + 0.22 * s.brillo * tenue + ")"; ctx.stroke();
      }
      const rh = Math.max(s.r * 6, 0.1);
      const halo = ctx.createRadialGradient(s.dx, s.dy, 0, s.dx, s.dy, rh);
      halo.addColorStop(0, "rgba(232,195,106," + 0.5 * s.brillo * tenue + ")"); halo.addColorStop(1, "rgba(232,195,106,0)");
      ctx.beginPath(); ctx.arc(s.dx, s.dy, rh, 0, 6.284); ctx.fillStyle = halo; ctx.fill();
      ctx.beginPath(); ctx.arc(s.dx, s.dy, s.r, 0, 6.284); ctx.fillStyle = "rgba(248,235,205," + s.brillo * tenue + ")"; ctx.fill();
    }
  }

  return {
    iniciar() { if (activo) return; activo = true; medir(); requestAnimationFrame(pintar); },
    detener() { activo = false; },
    encender() {
      const m = 0.1;
      const ux = m + Math.random() * (1 - 2 * m), uy = m + Math.random() * (1 - 2 * m);
      estrellas.push({ ux, uy, x: ux * W, y: uy * H, r: 0, meta: (Math.random() * 1.7 + 2.3) * dpr, brillo: 0 });
    },
    apagar() { estrellas.pop(); },
    reunir(v) { estrellas.reunir = v; },
    atenuar(v) { tenueMeta = v ? 0.12 : 1; },
    limpiar() { estrellas.length = 0; estrellas.reunir = false; reunir = 0; },
    puntos() { return estrellas.map((s) => ({ x: s.ux * 100, y: s.uy * 100 })); },
    cargar(pts) { estrellas.length = 0; pts.forEach((p) => estrellas.push({ ux: p.x / 100, uy: p.y / 100, x: (p.x / 100) * W, y: (p.y / 100) * H, r: 3 * dpr, meta: 3 * dpr, brillo: 1 })); }
  };
}

/* =========================================================
   LA APP
   ========================================================= */
export function crearIO({ cosmos, avisar, alCerrar } = {}) {
  const app = $("ioApp"), escenario = $("ioEscenario"), hilo = $("ioHilo");
  const portada = $("ioPortada"), charla = $("ioCharla"), cargando = $("ioCargando"), resultado = $("ioResultado");
  const atras = $("ioAtras");
  const campo = crearCampo($("campo"));

  let A = {}, i = 0, abierto = false, sondeo = null, lineaTimer = null, actual = null;

  function mostrar(sec) {
    campo.atenuar(sec === resultado);
    [portada, charla, cargando, resultado].forEach((s) => (s.hidden = s !== sec));
    atras.hidden = sec !== charla || i === 0;
    escenario.scrollTop = 0;
  }

  function abrir({ origen, prellenar, lectura } = {}) {
    if (abierto) return;
    abierto = true;
    if (origen) {
      const r = origen.getBoundingClientRect();
      app.style.setProperty("--ox", r.left + r.width / 2 + "px");
      app.style.setProperty("--oy", r.top + r.height / 2 + "px");
    } else {
      app.style.setProperty("--ox", "50%"); app.style.setProperty("--oy", "50%");
    }
    app.hidden = false;
    document.body.classList.add("bloqueado");
    requestAnimationFrame(() => requestAnimationFrame(() => app.classList.add("abierto")));
    campo.iniciar();
    setTimeout(() => cosmos && cosmos.pausar(true), 1000);
    if (location.hash !== "#io") history.replaceState(null, "", location.pathname + location.search + "#io");

    if (lectura) return cargarLectura(lectura);

    const previa = leer(CLAVE_LECTURA);
    if (previa && previa.resultado && !prellenar) {
      A = previa.respuestas || {};
      campo.limpiar();
      if (previa.constelacion) campo.cargar(previa.constelacion);
      return pintarResultado(previa.resultado, { id: previa.id, local: previa.resultado.local });
    }

    const borrador = leer(CLAVE_BORRADOR);
    A = { ...(borrador?.A || {}), ...(prellenar || {}) };
    i = 0;
    campo.limpiar();
    mostrar(portada);
    setTimeout(() => $("ioEmpezar").focus({ preventScroll: true }), 700);
  }

  function cerrar() {
    if (!abierto) return;
    abierto = false;
    clearInterval(lineaTimer); clearTimeout(sondeo);
    cosmos && cosmos.pausar(false);
    app.classList.remove("abierto");
    document.body.classList.remove("bloqueado");
    setTimeout(() => { app.hidden = true; campo.detener(); }, 950);
    const url = new URL(location.href);
    url.hash = ""; url.searchParams.delete("lectura");
    history.replaceState(null, "", url.pathname + url.search);
    alCerrar && alCerrar();
  }

  $("ioCerrar").onclick = () => {
    if (!charla.hidden && i > 2 && !confirm("¿Cerrar IO? Tus respuestas quedan guardadas en este dispositivo para cuando vuelvas.")) return;
    cerrar();
  };
  $("ioEmpezar").onclick = () => { mostrar(charla); pregunta(); };
  atras.onclick = () => { if (i > 0) { i--; campo.apagar(); pregunta(-1); } };
  addEventListener("keydown", (e) => { if (abierto && e.key === "Escape") $("ioCerrar").click(); });

  /* ---------- una pregunta ---------- */
  function pregunta(dir = 1) {
    const s = Q[i];
    hilo.style.width = (i / Q.length) * 100 + "%";
    atras.hidden = i === 0;
    const valor = A[s.k] && A[s.k] !== "no especificado" ? A[s.k] : "";

    let entrada = "";
    if (s.tipo === "texto") entrada = `<input class="campo" id="in" type="text" placeholder="${esc(s.ph || "")}" autocomplete="off" spellcheck="false" value="${esc(valor)}">${s.vivo ? '<div class="vivo" id="vivo" aria-hidden="true"></div>' : ""}`;
    if (s.tipo === "fecha") entrada = `<input class="campo" id="in" type="date" max="${new Date().toISOString().slice(0, 10)}" min="1900-01-01" value="${esc(valor)}"><div class="vivo" id="vivo" aria-live="polite"></div>`;
    if (s.tipo === "hora") entrada = `<input class="campo" id="in" type="time" value="${esc(valor)}">`;
    if (s.tipo === "largo") entrada = `<textarea class="campo" id="in" placeholder="${esc(s.ph || "")}" maxlength="2500">${esc(valor)}</textarea><div class="campo-pie"><span>Nadie más lo lee. Solo IO.</span><span id="cuenta">0</span></div>`;
    if (s.tipo === "opcion") entrada = `<div class="opciones" role="listbox" aria-label="${esc(s.q)}">${AREAS.map((a, k) => `<button class="opcion${A.area === a.texto ? " elegida" : ""}" data-v="${esc(a.texto)}" role="option"><i aria-hidden="true">${a.glifo}</i>${esc(a.texto)}<kbd>${k + 1}</kbd></button>`).join("")}</div>`;

    const html = `<div class="escalon">
      <div class="paso"><span class="paso-n">${String(i + 1).padStart(2, "0")}</span><span class="paso-de">de ${Q.length}</span></div>
      ${s.clave ? `<span class="q-clave">${esc(s.clave)}</span>` : ""}
      <h2 class="q">${esc(s.q)}</h2>
      <p class="q-nota">${esc(s.nota)}</p>
      ${entrada}
      ${s.tipo !== "opcion" ? `<div class="fila"><button class="boton boton-oro" id="seguir"><span>${i === Q.length - 1 ? "Leer mi patrón" : "Seguir"}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>${s.saltar ? `<button class="saltar" id="saltar">${esc(s.saltar)}</button>` : ""}<span class="tecla">${s.tipo === "largo" ? "<kbd>Ctrl</kbd> + <kbd>Enter</kbd>" : "o pulsa <kbd>Enter</kbd>"}</span></div>` : ""}
    </div>`;

    const poner = () => {
      charla.innerHTML = html;
      enlazar(s);
    };
    const viejo = charla.firstElementChild;
    if (viejo && !quieto) { viejo.classList.add("saliendo"); setTimeout(poner, 260); } else poner();
  }

  function enlazar(s) {
    if (s.tipo === "opcion") {
      const ops = [...charla.querySelectorAll(".opcion")];
      ops.forEach((b) => (b.onclick = () => { ops.forEach((o) => o.classList.remove("elegida")); b.classList.add("elegida"); A[s.k] = b.dataset.v; setTimeout(avanzar, 260); }));
      charla.onkeydown = (e) => { const n = Number(e.key); if (n >= 1 && n <= ops.length) ops[n - 1].click(); };
      setTimeout(() => ops[0].focus({ preventScroll: true }), 300);
      return;
    }
    charla.onkeydown = null;
    const inp = $("in");
    setTimeout(() => inp.focus({ preventScroll: true }), 320);
    const vivo = $("vivo");
    const actualizar = () => {
      if (s.tipo === "largo") $("cuenta").textContent = inp.value.length + " / 2500";
      if (vivo && s.vivo) vivo.innerHTML = descomponer(inp.value);
      if (vivo && s.tipo === "fecha") {
        const p = perfil({ fecha: inp.value });
        vivo.innerHTML = p.camino ? `<span class="total">Camino de vida <b>${p.camino.valor}</b> · ${esc(SIGNIFICADOS[p.camino.valor].arquetipo)}${p.sol ? ` · Sol en ${esc(p.sol.nombre)} ${p.sol.glifo}` : ""}</span>` : "";
      }
    };
    inp.addEventListener("input", actualizar);
    actualizar();
    const ir = () => {
      const v = inp.value.trim();
      if (!v) { inp.classList.remove("error"); void inp.offsetWidth; inp.classList.add("error"); inp.focus(); return; }
      if (s.tipo === "fecha" && !perfil({ fecha: v }).camino) { inp.classList.add("error"); return; }
      A[s.k] = v; avanzar();
    };
    $("seguir").onclick = ir;
    inp.onkeydown = (e) => {
      if (e.key === "Enter" && (s.tipo !== "largo" || e.metaKey || e.ctrlKey)) { e.preventDefault(); ir(); }
    };
    const sk = $("saltar");
    if (sk) sk.onclick = () => { A[s.k] = "no especificado"; avanzar(); };
  }

  function avanzar() {
    campo.encender();
    guardar(CLAVE_BORRADOR, { A });
    i++;
    i < Q.length ? pregunta() : analizar();
  }

  /* ---------- leer ---------- */
  const LINEAS = ["Leyendo tu nombre", "Sumando tu fecha", "Buscando tu ascendente", "Cruzando tu linaje", "Encontrando la raíz", "Escribiendo lo que veo", "Eligiendo tus tres libros"];

  function pantallaCarga() {
    mostrar(cargando);
    hilo.style.width = "100%";
    campo.reunir(true);
    const linea = $("cargaLinea");
    let li = 0;
    linea.textContent = LINEAS[0];
    clearInterval(lineaTimer);
    lineaTimer = setInterval(() => {
      linea.style.opacity = 0;
      setTimeout(() => { li = (li + 1) % LINEAS.length; linea.textContent = LINEAS[li]; linea.style.opacity = 1; }, 450);
    }, 2800);
    const p = perfil(A);
    const nums = [["Camino de vida", p.camino], ["Destino", p.destino], ["Alma", p.alma], ["Personalidad", p.personalidad]].filter(([, v]) => v);
    $("cargaNumeros").innerHTML = nums.map(([n, v], k) => `<div style="animation-delay:${1 + k * 0.9}s"><b>${v.valor}</b><span>${esc(n)}</span></div>`).join("");
  }

  async function analizar() {
    pantallaCarga();
    const id = crypto.randomUUID ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
    const inicio = Date.now();
    let remoto = false;
    try {
      const r = await fetch(API.analizar, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...A }) });
      remoto = r.status === 202 || r.ok;
    } catch {}
    if (!remoto) {
      await espera(Math.max(0, 5200 - (Date.now() - inicio)));
      return terminar(lecturaLocal(A), null);
    }
    esperarLectura(id, inicio);
  }

  function esperarLectura(id, inicio) {
    const tope = inicio + 5 * 60 * 1000;
    const consultar = async () => {
      if (!abierto) return;
      try {
        const r = await fetch(`${API.lectura}?id=${encodeURIComponent(id)}`, { cache: "no-store" });
        const d = await r.json();
        if (d.estado === "listo" && d.resultado) return terminar(d.resultado, id);
        if (d.estado === "error" || d.estado === "limite") return fallo(d.error, d.estado);
      } catch {}
      if (Date.now() > tope) return fallo("IO tardó más de lo normal.", "error");
      sondeo = setTimeout(consultar, 3000);
    };
    sondeo = setTimeout(consultar, 6000);
  }

  function fallo(mensaje, estado) {
    const base = lecturaLocal(A);
    base.aviso = (mensaje || "No se pudo generar el análisis completo.") + (estado === "limite" ? "" : " Mientras tanto, esta es tu lectura base, calculada con tus números.");
    terminar(base, null);
  }

  function terminar(res, id) {
    clearInterval(lineaTimer);
    const constelacion = campo.puntos();
    campo.reunir(false);
    borrar(CLAVE_BORRADOR);
    guardar(CLAVE_LECTURA, { id, respuestas: publico(A), resultado: res, constelacion, fecha: Date.now() });
    if (id) {
      const url = new URL(location.href);
      url.searchParams.set("lectura", id); url.hash = "io";
      history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
    pintarResultado(res, { id, local: res.local });
  }

  const publico = (a) => ({ nombre: a.nombre, apodo: a.apodo, fecha: a.fecha, hora: a.hora, lugar: a.lugar, vives: a.vives, area: a.area });

  async function cargarLectura(id) {
    pantallaCarga();
    $("cargaNumeros").innerHTML = "";
    $("cargaLinea").textContent = "Abriendo tu lectura";
    const previa = leer(CLAVE_LECTURA);
    try {
      const r = await fetch(`${API.lectura}?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const d = await r.json();
      if (d.estado === "listo") {
        A = d.respuestas || {};
        campo.limpiar();
        if (previa?.id === id && previa.constelacion) campo.cargar(previa.constelacion);
        return pintarResultado(d.resultado, { id });
      }
      if (d.estado === "pendiente") { A = d.respuestas || {}; return esperarLectura(id, Date.now()); }
    } catch {}
    if (previa?.id === id) { A = previa.respuestas; return pintarResultado(previa.resultado, { id }); }
    clearInterval(lineaTimer);
    mostrar(portada);
    avisar && avisar("No encontramos esa lectura. Puedes hacer una nueva.");
  }

  /* ---------- el análisis ---------- */
  function mapaSVG() {
    const pts = campo.puntos();
    if (pts.length < 2) return "";
    const lineas = pts.slice(1).map((p, k) => `<line x1="${pts[k].x.toFixed(2)}" y1="${pts[k].y.toFixed(2)}" x2="${p.x.toFixed(2)}" y2="${p.y.toFixed(2)}" style="animation-delay:${0.3 + k * 0.14}s"/>`).join("");
    const puntos = pts.map((p, k) => `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${k === pts.length - 1 ? 1.3 : 0.9}" style="animation-delay:${0.2 + k * 0.14}s"/>`).join("");
    return `<svg class="r-mapa" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Tu constelación: una estrella por cada respuesta">${lineas}${puntos}</svg>`;
  }

  function libroMini(l) {
    return `<div class="libro3d" style="--lomo:${l.lomo}"><div class="l-frente"><picture><source srcset="assets/img/portadas/libro${l.n}.webp" type="image/webp"><img src="assets/img/portadas/libro${l.n}.jpg" alt="Portada de ${esc(l.titulo)}" loading="lazy"></picture></div><div class="l-lomo"><span>${esc(l.titulo)}</span></div><div class="l-paginas"></div><div class="l-dorso"></div></div>`;
  }

  function pintarResultado(d, { id, local } = {}) {
    clearInterval(lineaTimer); clearTimeout(sondeo);
    actual = { d, id };
    mostrar(resultado);
    campo.atenuar(true);
    hilo.style.width = "100%";

    const nombre = A.nombre || "Tu lectura";
    const meta = [A.fecha, A.hora && A.hora !== "no especificado" ? A.hora : "", A.lugar].filter(Boolean).map(esc).join(" · ");
    const codigos = (d.numeros || []).map((n) => `<div class="codigo"><b data-meta="${esc(n.valor)}">0</b><span>${esc(n.nombre)}</span></div>`).join("");
    const caps = (d.capitulos || []).map((c, n) => `
      <article class="cap revela">
        <p class="cap-ceja">${String(n + 1).padStart(2, "0")} — ${esc(c.etiqueta || "")}</p>
        <h3>${esc(c.titulo)}</h3>
        ${(c.parrafos || []).map((p) => `<p>${esc(p)}</p>`).join("")}
        ${c.frase ? `<blockquote class="destacada">${esc(c.frase)}</blockquote>` : ""}
      </article>`).join("");

    const libros = (d.libros || []).map((b) => ({ ...b, libro: porRomano(b.numero) })).filter((b) => b.libro);
    const tres = libros.map((b) => `
      <div class="tu-libro">
        <button class="ficha-boton" data-libro="${b.libro.n}" aria-label="Ver ${esc(b.libro.titulo)}">${libroMini(b.libro)}</button>
        <div><span class="ficha-num">LIBRO ${b.libro.romano}</span><h4>${esc(b.libro.titulo)}</h4><p>${esc(b.porque)}</p></div>
      </div>`).join("");

    const aviso = d.aviso || (local ? "Esta es tu lectura base, calculada con tus números en este dispositivo. El análisis completo de IO cruza además tu carta natal y la raíz de tu nombre." : "");

    resultado.innerHTML = `
      <header class="r-cabeza">
        ${mapaSVG()}
        ${campo.puntos().length ? `<p class="r-ceja">Tu constelación · ${campo.puntos().length} estrellas</p>` : `<p class="r-ceja">Tu lectura</p>`}
        <h2 class="r-nombre">${esc(nombre)}</h2>
        <div class="r-meta">${meta}${A.vives && A.vives !== "no especificado" ? `<br>Vive en ${esc(A.vives)}` : ""}</div>
        ${aviso ? `<p class="r-local">${esc(aviso)}</p>` : ""}
      </header>
      <div class="codigos">${codigos}</div>
      ${caps}
      ${libros.length ? `
      <section class="r-libros revela">
        <p class="r-ceja">Tus tres libros</p>
        <h3>Por aquí <em>empiezas</em></h3>
        <div class="tres">${tres}</div>
        <div class="captura" id="captura">
          <h4>¿Te los envío a tu correo?</h4>
          <p>Te llegan los tres PDFs y el enlace para volver a leer tu análisis cuando quieras.</p>
          <form class="form-correo" id="formLibros" novalidate>
            <label for="correoLibros" class="solo-lector">Correo electrónico</label>
            <input type="email" id="correoLibros" placeholder="tu@correo.com" required autocomplete="email">
            <button type="submit" class="boton boton-oro"><span>Enviármelos</span></button>
          </form>
          <p class="form-estado" id="estadoLibros" role="status"></p>
          <div class="descargas" id="descargas" hidden></div>
        </div>
      </section>` : ""}
      <div class="r-acciones">
        <button class="boton boton-fantasma" id="rImprimir"><span>Guardar como PDF</span></button>
        <button class="boton boton-fantasma" id="rCompartir"><span>Invitar a alguien a IO</span></button>
        ${id ? `<button class="boton boton-fantasma" id="rEnlace"><span>Copiar enlace de mi lectura</span></button>` : ""}
        <button class="boton boton-fantasma" id="rBiblioteca"><span>Ver los diez libros</span></button>
      </div>
      <div class="r-pie">
        <p>Esto es una lectura, no un diagnóstico. IO no predice el futuro. Si algo de lo que leíste te movió fuerte, vale la pena hablarlo con alguien de confianza o con un profesional.</p>
        <p style="margin-top:1rem"><button class="saltar" id="rNueva">Hacer una lectura nueva</button></p>
      </div>`;

    contar();
    observar();
    enlazarResultado(libros, id);
  }

  function contar() {
    resultado.querySelectorAll(".codigo b").forEach((el, k) => {
      const meta = el.dataset.meta, n = parseInt(meta, 10);
      if (isNaN(n) || quieto) { el.textContent = meta; return; }
      let v = 0;
      const paso = () => { v += Math.max(1, Math.ceil((n - v) / 6)); if (v >= n) { el.textContent = meta; return; } el.textContent = v; setTimeout(paso, 60); };
      setTimeout(paso, 500 + k * 140);
    });
  }

  function observar() {
    const obs = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visto"); obs.unobserve(e.target); } }), { root: escenario, threshold: 0.12 });
    resultado.querySelectorAll(".revela").forEach((el) => obs.observe(el));
  }

  function enlazarResultado(libros, id) {
    resultado.querySelectorAll("[data-libro]").forEach((b) => (b.onclick = () => document.dispatchEvent(new CustomEvent("abrir-libro", { detail: Number(b.dataset.libro) }))));
    $("rImprimir").onclick = () => window.print();
    $("rCompartir").onclick = async () => {
      const url = location.origin + location.pathname + "#io";
      const datos = { title: "IO — Andrés Carreño", text: "Once preguntas que leen la raíz de lo que se te repite. Gratis.", url };
      try { if (navigator.share) return await navigator.share(datos); } catch { return; }
      copiar(url, "Enlace a IO copiado. Tu lectura sigue siendo privada.");
    };
    const en = $("rEnlace");
    if (en) en.onclick = () => copiar(`${location.origin}${location.pathname}?lectura=${id}#io`, "Enlace copiado. Quien lo tenga podrá leer tu análisis.");
    $("rBiblioteca").onclick = () => { cerrar(); setTimeout(() => document.getElementById("biblioteca").scrollIntoView({ behavior: quieto ? "auto" : "smooth" }), 500); };
    $("rNueva").onclick = () => {
      if (!confirm("¿Empezar una lectura nueva? La actual seguirá disponible en su enlace si la guardaste.")) return;
      borrar(CLAVE_LECTURA); A = {}; i = 0; campo.limpiar(); hilo.style.width = "0";
      const url = new URL(location.href); url.searchParams.delete("lectura"); history.replaceState(null, "", url.pathname + url.search + "#io");
      mostrar(portada);
    };

    const form = $("formLibros");
    if (!form) return;
    form.onsubmit = async (e) => {
      e.preventDefault();
      const input = $("correoLibros"), estado = $("estadoLibros"), boton = form.querySelector("button");
      const email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { estado.className = "form-estado err"; estado.textContent = "Revisa tu correo, parece incompleto."; input.focus(); return; }
      boton.disabled = true; estado.className = "form-estado"; estado.textContent = "Enviando…";
      const p = perfil(A);
      let r = null, d = {};
      try {
        r = await fetch(API.entregar, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, tipo: "libros", nombre: A.nombre, area: A.area, camino: p.camino?.valor, libros: libros.map((b) => b.libro.romano), lecturaId: id })
        });
        d = await r.json().catch(() => ({}));
      } catch {}
      if (r && r.status === 400) { estado.className = "form-estado err"; estado.textContent = d.error || "Revisa tu correo."; boton.disabled = false; return; }
      const enviado = !!(r && r.ok && d.enviado);
      estado.className = "form-estado ok";
      estado.textContent = enviado ? "Listo. Revisa tu bandeja (y la de promociones, por si acaso)." : "Gracias. Aquí los tienes para descargar ahora mismo:";
      form.hidden = true;
      const lista = $("descargas");
      lista.hidden = false;
      lista.innerHTML = libros.map((b) => `<a href="${b.libro.pdf}" download="${esc(b.libro.archivo)}"><span>${esc(b.libro.titulo)}</span><small>PDF ↓</small></a>`).join("");
    };
  }

  function copiar(texto, msj) {
    (navigator.clipboard ? navigator.clipboard.writeText(texto) : Promise.reject())
      .then(() => avisar && avisar(msj))
      .catch(() => prompt("Copia este enlace:", texto));
  }

  return { abrir, cerrar, get abierto() { return abierto; } };
}

/* ---------- utilidades para la calculadora de la página ---------- */
export function descomponer(texto) {
  const partes = String(texto || "").split(/(\s+)/);
  let html = "", total = 0, k = 0;
  for (const parte of partes) {
    if (/^\s+$/.test(parte)) { html += '<span class="esp"></span>'; continue; }
    let pal = "";
    for (const c of letras(parte)) {
      const v = valorLetra(c);
      total += v;
      pal += `<span class="cl${esVocal(c) ? " v" : ""}" style="animation-delay:${Math.min(k++, 30) * 0.01}s"><b>${c}</b><i>${v}</i></span>`;
    }
    if (pal) html += `<span class="pal">${pal}</span>`;
  }
  const d = destino(texto);
  if (d) html += `<span class="total">= ${total}${d.pasos.length > 1 ? " → " + d.pasos.slice(1).join(" → ") : ""} · <b>${d.valor}</b></span>`;
  return html;
}

export { SIGNIFICADOS };
