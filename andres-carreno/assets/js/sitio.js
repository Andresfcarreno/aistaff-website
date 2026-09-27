// La página: intro, cosmos, scroll, estantería 3D, modal, calculadora, IO.

import { crearCosmos } from "./cosmos.js";
import { LIBROS, TEMAS } from "./catalogo.js";
import { perfil } from "./numerologia.js";
import { crearIO, descomponer, SIGNIFICADOS } from "./io.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finoPuntero = matchMedia("(hover: hover) and (pointer: fine)").matches;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/* ---------- aviso ---------- */
let avisoT;
function avisar(texto) {
  const a = $("#aviso");
  a.textContent = texto;
  a.classList.add("on");
  clearTimeout(avisoT);
  avisoT = setTimeout(() => a.classList.remove("on"), 3800);
}

/* ---------- cosmos ---------- */
let cosmos = null;
try { cosmos = crearCosmos($("#cosmos"), { quieto }); } catch (e) { console.warn(e); }
if (!cosmos) document.documentElement.classList.add("sin-webgl");

/* ---------- IO ---------- */
const io = crearIO({ cosmos, avisar });

/* ---------- intro ---------- */
function intro() {
  const el = $("#intro");
  const visto = (() => { try { return sessionStorage.getItem("intro-vista"); } catch { return null; } })();
  const quitar = () => {
    el.classList.add("fuera");
    document.body.classList.remove("cargando");
    setTimeout(() => el.remove(), 1200);
    arrancarHero();
  };
  if (quieto || visto) { el.remove(); document.body.classList.remove("cargando"); arrancarHero(); return; }
  try { sessionStorage.setItem("intro-vista", "1"); } catch {}
  $$(".intro-nombre span").forEach((s, k) => (s.style.animationDelay = 0.5 + k * 0.05 + "s"));
  const bin = $("#introBinario");
  let n = 0;
  const t = setInterval(() => {
    bin.textContent = Array.from({ length: 2 }, () => Array.from({ length: 8 }, () => (Math.random() < 0.5 ? 0 : 1)).join("")).join(" ");
    if (++n > 16) { clearInterval(t); bin.textContent = "01001001 01001111 · IO"; }
  }, 70);
  setTimeout(quitar, 2300);
  el.addEventListener("click", quitar, { once: true });
}

/* ---------- hero ---------- */
function partirTitulo() {
  const h = $("#heroTitulo");
  let k = 0;
  $$(".linea", h).forEach((linea) => {
    const recorrer = (nodo) => {
      [...nodo.childNodes].forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((pal) => {
            if (!pal) return;
            if (/^\s+$/.test(pal)) { frag.append(" "); return; }
            const w = document.createElement("span");
            w.style.whiteSpace = "nowrap";
            w.style.display = "inline-block";
            [...pal].forEach((ch) => {
              const l = document.createElement("span");
              l.className = "l"; l.textContent = ch; l.style.setProperty("--j", k); l.style.setProperty("--i", k++);
              w.append(l);
            });
            frag.append(w);
          });
          c.replaceWith(frag);
        } else recorrer(c);
      });
    };
    recorrer(linea);
  });
  h.setAttribute("aria-label", "Todo lo que buscas ya está escrito");
}

function arrancarHero() {
  requestAnimationFrame(() => {
    $("#heroTitulo").classList.add("visto");
    $$(".hero .revela").forEach((e) => e.classList.add("visto"));
    contarDatos();
    cosmos && cosmos.rafaga(1.2);
  });
}

function contarDatos() {
  $$("[data-contar]").forEach((el, k) => {
    const meta = Number(el.dataset.contar);
    if (quieto || meta === 0) { el.textContent = meta; return; }
    let v = 0;
    setTimeout(function paso() { v++; el.textContent = v; if (v < meta) setTimeout(paso, 1100 / meta); }, 900 + k * 120);
  });
}

/* ---------- scroll ---------- */
const nav = $("#nav"), hilo = $("#hilo");
const secciones = $$("[data-forma]");
const enlaces = $$(".nav-links a");
let ultimoY = scrollY, ticking = false;

function alScroll() {
  ticking = false;
  const y = scrollY, vh = innerHeight, max = document.documentElement.scrollHeight - vh;
  hilo.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  nav.classList.toggle("solida", y > 40);
  nav.classList.toggle("oculta", y > ultimoY && y > vh * 0.8 && !$("#navLinks").classList.contains("abierto"));
  ultimoY = y;

  // hero: se aleja al bajar
  if (!quieto && y < vh * 1.2) {
    const p = y / vh;
    $("#heroContenido").style.transform = `translate3d(0, ${p * 120}px, 0) scale(${1 - p * 0.12})`;
    $("#heroContenido").style.opacity = String(Math.max(0, 1 - p * 1.3));
  }

  // qué forma toma el cosmos
  if (cosmos) {
    const centro = vh * 0.55;
    let meta = Number(secciones[0].dataset.forma);
    for (let k = 0; k < secciones.length; k++) {
      const r = secciones[k].getBoundingClientRect();
      if (r.top <= centro) {
        meta = Number(secciones[k].dataset.forma);
        const sig = secciones[k + 1];
        if (sig && r.bottom > centro) {
          const f = (centro - r.top) / Math.max(1, r.height);
          const siguiente = Number(sig.dataset.forma);
          const t = Math.max(0, Math.min(1, (f - 0.72) / 0.28));
          meta += (siguiente - meta) * t;
        }
      }
    }
    cosmos.forma(meta);
    const enBiblio = $("#estante").getBoundingClientRect();
    const tapa = enBiblio.top < vh * 0.7 && enBiblio.bottom > vh * 0.3;
    cosmos.alfa(tapa ? 0.35 : y < vh * 0.6 ? 1 : 0.75);
  }

  // enlace activo
  let activo = null;
  ["biblioteca", "io", "autor", "lista"].forEach((id) => { const r = document.getElementById(id).getBoundingClientRect(); if (r.top < vh * 0.45) activo = id; });
  enlaces.forEach((a) => a.classList.toggle("activo", a.dataset.sec === activo));

  // manifiesto palabra por palabra
  const man = $("#manifiestoTexto"), rm = man.getBoundingClientRect();
  const prog = Math.max(0, Math.min(1, (vh * 0.85 - rm.top) / (rm.height + vh * 0.35)));
  const pals = $$(".p", man), enc = Math.round(prog * pals.length);
  pals.forEach((p, k) => p.classList.toggle("on", k < enc));
}
addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(alScroll); } }, { passive: true });
addEventListener("resize", alScroll);

function partirManifiesto() {
  const m = $("#manifiestoTexto");
  const recorrer = (nodo) => [...nodo.childNodes].forEach((c) => {
    if (c.nodeType === 3) {
      const frag = document.createDocumentFragment();
      c.textContent.split(/(\s+)/).forEach((w) => {
        if (!w) return;
        if (/^\s+$/.test(w)) return frag.append(w);
        const s = document.createElement("span"); s.className = "p"; s.textContent = w; frag.append(s);
      });
      c.replaceWith(frag);
    } else recorrer(c);
  });
  recorrer(m);
  if (quieto) $$(".p", m).forEach((p) => p.classList.add("on"));
}

/* ---------- revelado ---------- */
const obs = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visto"); obs.unobserve(e.target); } }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
function observar(raiz = document) { $$(".revela:not(.visto)", raiz).filter((el) => !el.closest(".hero") && !el.closest(".io")).forEach((el) => obs.observe(el)); }

/* ---------- estantería ---------- */
function portada(l, carga = "lazy") {
  return `<picture><source srcset="assets/img/portadas/libro${l.n}.webp" type="image/webp"><img src="assets/img/portadas/libro${l.n}.jpg" alt="Portada de ${esc(l.titulo)}" loading="${carga}" width="600" height="849"></picture>`;
}

function estante() {
  const e = $("#estante");
  e.innerHTML = LIBROS.map((l, k) => `
    <article class="ficha revela" data-tema="${l.tema}" style="--d:${(k % 5) * 0.07}s">
      <button class="ficha-boton" data-libro="${l.n}" aria-label="Abrir ${esc(l.titulo)}">
        <div class="libro3d" style="--lomo:${l.lomo}">
          <div class="l-frente">${portada(l)}</div>
          <div class="l-lomo"><span>${esc(l.titulo)}</span></div>
          <div class="l-paginas"></div>
          <div class="l-dorso"></div>
        </div>
      </button>
      <div class="ficha-texto">
        <span class="ficha-num">LIBRO ${l.romano}</span>
        <h3>${esc(l.titulo)}</h3>
        <p>${esc(l.corto)}</p>
        <a class="ficha-bajar" href="${l.pdf}" download="${esc(l.archivo)}">Descargar PDF <span aria-hidden="true">↓</span></a>
      </div>
    </article>`).join("");

  const f = $("#filtros");
  f.innerHTML = TEMAS.map((t, k) => `<button class="filtro" role="tab" aria-selected="${k === 0}" data-tema="${t.id}">${t.nombre}<sup>${t.id === "todos" ? LIBROS.length : LIBROS.filter((l) => l.tema === t.id).length}</sup></button>`).join("");
  f.addEventListener("click", (ev) => {
    const b = ev.target.closest(".filtro");
    if (!b) return;
    $$(".filtro", f).forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    $$(".ficha", e).forEach((fi) => fi.classList.toggle("fuera", b.dataset.tema !== "todos" && fi.dataset.tema !== b.dataset.tema));
  });

  e.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-libro]");
    if (b) abrirLibro(Number(b.dataset.libro), b);
  });

  if (finoPuntero && !quieto) {
    $$(".ficha-boton", e).forEach((b) => {
      const libro = $(".libro3d", b), frente = $(".l-frente", b);
      b.addEventListener("pointermove", (ev) => {
        const r = b.getBoundingClientRect();
        const x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
        libro.style.setProperty("--gr", (x - 0.5) * 22 + "deg");
        libro.style.setProperty("--gx", (0.5 - y) * 14 + "deg");
        frente.style.setProperty("--bx", x * 100 + "%");
        frente.style.setProperty("--by", y * 100 + "%");
      });
      b.addEventListener("pointerleave", () => { libro.style.setProperty("--gr", "0deg"); libro.style.setProperty("--gx", "0deg"); });
    });
  }
}

/* ---------- modal de libro ---------- */
const modal = $("#modalLibro");
let libroActual = 1, focoPrevio = null;

function llenarModal(n) {
  const l = LIBROS.find((x) => x.n === n);
  libroActual = n;
  const la = $("#libroAbierto");
  la.classList.remove("abierto");
  $(".la-tapa img", la).src = `assets/img/portadas/libro${l.n}.jpg`;
  $(".la-tapa img", la).alt = `Portada de ${l.titulo}`;
  $(".la-romano", la).textContent = l.romano;
  $(".la-frase", la).textContent = l.hook;
  $("#modalNum").textContent = `Libro ${l.romano} · ${TEMAS.find((t) => t.id === l.tema).nombre}`;
  $("#modalTitulo").textContent = l.titulo + (l.subtitulo ? `: ${l.subtitulo}` : "");
  $("#modalCorto").textContent = l.corto;
  $("#modalLargo").textContent = l.largo;
  const d = $("#modalDescargar");
  d.href = l.pdf; d.setAttribute("download", l.archivo);
  $("#modalPos").textContent = `${String(n).padStart(2, "0")} / ${LIBROS.length}`;
  setTimeout(() => la.classList.add("abierto"), quieto ? 0 : 450);
}

function abrirLibro(n, desde) {
  focoPrevio = desde || document.activeElement;
  llenarModal(n);
  modal.hidden = false;
  document.body.classList.add("bloqueado");
  setTimeout(() => $(".modal-x", modal).focus({ preventScroll: true }), 50);
}
function cerrarLibro() {
  modal.hidden = true;
  if (!io.abierto) document.body.classList.remove("bloqueado");
  focoPrevio && focoPrevio.focus && focoPrevio.focus({ preventScroll: true });
}
modal.addEventListener("click", (e) => { if (e.target.closest("[data-cerrar]")) cerrarLibro(); });
$("#modalPrev").onclick = () => llenarModal(((libroActual - 2 + LIBROS.length) % LIBROS.length) + 1);
$("#modalNext").onclick = () => llenarModal((libroActual % LIBROS.length) + 1);
addEventListener("keydown", (e) => {
  if (modal.hidden) return;
  if (e.key === "Escape") { e.stopImmediatePropagation(); cerrarLibro(); }
  if (e.key === "ArrowRight") $("#modalNext").click();
  if (e.key === "ArrowLeft") $("#modalPrev").click();
}, true);
document.addEventListener("abrir-libro", (e) => abrirLibro(e.detail));
modal.style.zIndex = 600;

/* ---------- calculadora viva ---------- */
function calculadora() {
  const nombre = $("#calcNombre"), fecha = $("#calcFecha");
  const poner = (id, v, extra) => {
    const el = $("#" + id), b = $("b", el);
    const nuevo = v ? String(v.valor) : "·";
    if (b.textContent !== nuevo) { b.textContent = nuevo; el.classList.remove("pulso"); void el.offsetWidth; if (v) el.classList.add("pulso"); }
    let s = $("small", el);
    if (!s) { s = document.createElement("small"); el.append(s); }
    s.textContent = extra || "";
  };
  const actualizar = () => {
    const p = perfil({ nombre: nombre.value, fecha: fecha.value });
    $("#calcLetras").innerHTML = descomponer(nombre.value).replace(/<span class="total">.*<\/span>$/, "");
    poner("calcDestino", p.destino, p.destino && p.destino.pasos.length > 1 ? p.destino.pasos.join(" → ") : "");
    poner("calcCamino", p.camino, p.camino ? `${p.camino.partes.dia} + ${p.camino.partes.mes} + ${p.camino.partes.anio}` : "");
    poner("calcAlma", p.alma, "");
    const arq = $("#calcArquetipo");
    if (p.camino) arq.textContent = `Camino ${p.camino.valor}: ${SIGNIFICADOS[p.camino.valor].arquetipo}. ${SIGNIFICADOS[p.camino.valor].esencia.split(".")[0]}.`;
    else if (p.destino) arq.textContent = `Destino ${p.destino.valor}: ${SIGNIFICADOS[p.destino.valor].arquetipo}. Ahora tu fecha.`;
    else arq.textContent = "Tus números aparecerán aquí mientras escribes.";
  };
  nombre.addEventListener("input", actualizar);
  fecha.addEventListener("input", actualizar);
  fecha.max = new Date().toISOString().slice(0, 10);

  const marco = $(".calc-marco");
  if (finoPuntero && !quieto) {
    marco.addEventListener("pointermove", (e) => {
      const r = marco.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      marco.style.setProperty("--mx", x * 100 + "%"); marco.style.setProperty("--my", y * 100 + "%");
      marco.style.transform = `perspective(1200px) rotateY(${(x - 0.5) * 6}deg) rotateX(${(0.5 - y) * 6}deg)`;
    });
    marco.addEventListener("pointerleave", () => (marco.style.transform = ""));
  }
}

/* ---------- abrir IO ---------- */
function prepararIO() {
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-abrir-io]");
    if (!b) return;
    e.preventDefault();
    if (!modal.hidden) cerrarLibro();
    cerrarMenu();
    const prellenar = {};
    const n = $("#calcNombre").value.trim(), f = $("#calcFecha").value;
    if (b.id === "calcSeguir") { if (n) prellenar.nombre = n; if (f) prellenar.fecha = f; }
    cosmos && cosmos.rafaga(1.6);
    io.abrir({ origen: b, prellenar: Object.keys(prellenar).length ? prellenar : null });
  });

  let previa = null;
  try { previa = JSON.parse(localStorage.getItem("io-lectura") || "null"); } catch {}
  if (previa && previa.resultado) {
    $("#ioCta span").textContent = "Ver mi lectura";
    const p = $("#ioPrevia");
    p.hidden = false;
    p.innerHTML = `Ya tienes una lectura${previa.respuestas?.nombre ? " de " + esc(previa.respuestas.nombre.split(" ")[0]) : ""}.`;
  }

  const q = new URLSearchParams(location.search);
  if (q.get("lectura")) io.abrir({ lectura: q.get("lectura") });
  else if (location.hash === "#io") setTimeout(() => io.abrir({ origen: $("#ioCta") }), quieto ? 0 : 600);
}

/* ---------- lista de novedades ---------- */
function lista() {
  const form = $("#formLista"), estado = $("#estadoLista");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#correoLista").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { estado.className = "form-estado err"; estado.textContent = "Revisa tu correo, parece incompleto."; return; }
    const b = $("button", form); b.disabled = true;
    estado.className = "form-estado"; estado.textContent = "Anotándote…";
    let ok = false;
    try {
      const r = await fetch("/.netlify/functions/entregar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, tipo: "novedades" }) });
      ok = r.ok;
      if (r.status === 400) { const d = await r.json(); estado.className = "form-estado err"; estado.textContent = d.error; b.disabled = false; return; }
    } catch {}
    if (ok) {
      estado.className = "form-estado ok"; estado.textContent = "Listo — quedaste en la lista. El próximo libro te llega directo.";
      form.reset();
    } else if (window.VISTA_PREVIA) {
      estado.className = "form-estado ok"; estado.textContent = "Vista previa: en tu sitio publicado este correo queda guardado en tu lista.";
    } else {
      estado.className = "form-estado ok"; estado.textContent = "Se abrirá tu app de correo para confirmar — un solo paso.";
      location.href = "mailto:andycarrenofx@gmail.com?subject=" + encodeURIComponent("Quiero recibir los nuevos libros") + "&body=" + encodeURIComponent("Mi correo para la lista: " + email);
    }
    b.disabled = false;
  });
}

/* ---------- menú móvil ---------- */
const menu = $("#navMenu"), links = $("#navLinks");
function cerrarMenu() { links.classList.remove("abierto"); menu.setAttribute("aria-expanded", "false"); }
menu.addEventListener("click", () => { const a = !links.classList.contains("abierto"); links.classList.toggle("abierto", a); menu.setAttribute("aria-expanded", String(a)); });
links.addEventListener("click", (e) => { if (e.target.closest("a")) cerrarMenu(); });

/* ---------- botones magnéticos + cursor ---------- */
function magia() {
  if (!finoPuntero || quieto) return;
  document.body.classList.add("con-cursor");
  const c = $("#cursor");
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener("pointermove", (e) => {
    x = e.clientX; y = e.clientY; c.classList.add("visible");
    const t = e.target;
    c.classList.toggle("texto", !!t.closest("input, textarea"));
    c.classList.toggle("encima", !t.closest("input, textarea") && !!t.closest("a, button, [data-libro], .filtro"));
  }, { passive: true });
  document.addEventListener("pointerleave", () => c.classList.remove("visible"));
  (function mover() {
    cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
    c.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(mover);
  })();

  $$(".magnetico").forEach((b) => {
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      b.style.transform = `translate(${dx * 0.22}px, ${dy * 0.3}px)`;
    });
    b.addEventListener("pointerleave", () => (b.style.transform = ""));
  });

  // el título del hero sigue al ratón en 3D
  const h = $("#heroTitulo");
  addEventListener("pointermove", (e) => {
    if (scrollY > innerHeight) return;
    const rx = (e.clientY / innerHeight - 0.5) * -8, ry = (e.clientX / innerWidth - 0.5) * 10;
    h.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  }, { passive: true });
  h.style.transition = "transform .8s cubic-bezier(.2,.7,.2,1)";
}

/* ---------- arranque ---------- */
partirTitulo();
partirManifiesto();
estante();
calculadora();
observar();
lista();
magia();
prepararIO();
alScroll();
intro();
