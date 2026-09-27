// EL COSMOS
// Un campo de partículas en WebGL que cambia de forma mientras bajas:
//   0 galaxia áurea · 1 libro abierto · 2 sigilo de IO · 3 flor de la vida · 4 cielo
// Sin librerías: un solo shader que mezcla las cinco formas.

const TAU = Math.PI * 2;

function gauss() {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
}

// ---------- LAS FORMAS ----------
function galaxia(i, n) {
  const r0 = Math.random();
  if (r0 < 0.16) {
    // halo
    const t = Math.acos(2 * Math.random() - 1), f = TAU * Math.random(), r = 1.9 + Math.random() * 1.6;
    return [r * Math.sin(t) * Math.cos(f), r * Math.cos(t) * 0.6, r * Math.sin(t) * Math.sin(f)];
  }
  if (r0 < 0.28) {
    // núcleo
    return [gauss() * 0.16, gauss() * 0.07, gauss() * 0.16];
  }
  const brazos = 3, brazo = i % brazos;
  const r = Math.pow(Math.random(), 0.62) * 1.75 + 0.08;
  const a = brazo * (TAU / brazos) + r * 2.7 + gauss() * 0.22 / (r + 0.4);
  const disp = 0.07 + r * 0.06;
  return [Math.cos(a) * r + gauss() * disp, gauss() * 0.05 * (1.9 - r), Math.sin(a) * r + gauss() * disp];
}

function libro() {
  const r0 = Math.random();
  if (r0 < 0.14) {
    // luz que sube de las páginas
    const y = 0.72 + Math.pow(Math.random(), 0.8) * 1.3;
    return [gauss() * 0.22 * (y - 0.4), y, gauss() * 0.1 + 0.25];
  }
  if (r0 < 0.19) {
    // lomo
    return [gauss() * 0.01, (Math.random() - 0.5) * 1.5, 0];
  }
  const lado = Math.random() < 0.5 ? -1 : 1;
  const u = Math.pow(Math.random(), 0.9);
  const v = (Math.random() - 0.5) * 1.5;
  // las hojas se curvan desde el lomo hacia quien mira
  const z = 0.5 * Math.sin(Math.min(u, 1) * Math.PI * 0.62) - 0.15 * u;
  // borde de hojas: algunas partículas marcan capas
  const capa = Math.random() < 0.25 ? Math.floor(Math.random() * 5) * 0.018 : 0;
  return [lado * (u * 1.3), v - capa, z + capa * 2 + gauss() * 0.006];
}

function sigilo() {
  const r0 = Math.random();
  const anillo = (R, grosor) => {
    const a = TAU * Math.random();
    const r = R + gauss() * grosor;
    return [Math.cos(a) * r, Math.sin(a) * r, gauss() * 0.02];
  };
  if (r0 < 0.3) return anillo(1.42, 0.012);
  if (r0 < 0.48) {
    // anillo punteado
    const seg = Math.floor(Math.random() * 42);
    const a = (seg / 42) * TAU + Math.random() * (TAU / 42) * 0.28;
    const r = 1.06 + gauss() * 0.01;
    return [Math.cos(a) * r, Math.sin(a) * r, gauss() * 0.02];
  }
  if (r0 < 0.7) return anillo(0.7, 0.02);
  if (r0 < 0.9) return [(Math.random() - 0.5) * 0.14, (Math.random() - 0.5) * 1.08, gauss() * 0.02];
  return anillo(1.9 + Math.random() * 1.2, 0.2);
}

const FLOR = (() => {
  const R = 0.4, c = [[0, 0]];
  for (let k = 0; k < 6; k++) c.push([Math.cos(k * TAU / 6) * R, Math.sin(k * TAU / 6) * R]);
  for (let k = 0; k < 6; k++) c.push([Math.cos(k * TAU / 6) * R * 2, Math.sin(k * TAU / 6) * R * 2]);
  for (let k = 0; k < 6; k++) c.push([Math.cos(k * TAU / 6 + TAU / 12) * R * Math.sqrt(3), Math.sin(k * TAU / 6 + TAU / 12) * R * Math.sqrt(3)]);
  return { R, c };
})();

function flor() {
  const r0 = Math.random();
  if (r0 < 0.1) {
    const a = TAU * Math.random(), r = FLOR.R * 3 + (Math.random() < 0.5 ? 0 : 0.08);
    return [Math.cos(a) * r, Math.sin(a) * r, gauss() * 0.015];
  }
  if (r0 < 0.18) {
    const a = TAU * Math.random(), r = 2 + Math.random() * 1.4;
    return [Math.cos(a) * r, Math.sin(a) * r, gauss() * 0.3];
  }
  const [cx, cy] = FLOR.c[Math.floor(Math.random() * FLOR.c.length)];
  const a = TAU * Math.random();
  return [cx + Math.cos(a) * FLOR.R, cy + Math.sin(a) * FLOR.R, gauss() * 0.012];
}

function cielo() {
  return [(Math.random() - 0.5) * 9, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 5 - 0.5];
}

const FORMAS = [galaxia, libro, sigilo, flor, cielo];

// ---------- SHADERS ----------
const VS = `
attribute vec3 p0; attribute vec3 p1; attribute vec3 p2; attribute vec3 p3; attribute vec3 p4;
attribute vec3 aR;
uniform float uMorph, uTime, uPx, uEscala, uRafaga, uAspecto;
uniform vec2 uRaton, uGiro;
uniform mat4 uProy;
varying float vTono, vBrillo;

mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
mat3 rotZ(float a){ float c=cos(a), s=sin(a); return mat3(c,s,0., -s,c,0., 0.,0.,1.); }

void main(){
  float t = fract(uMorph);
  float mezcla = sin(t * 3.14159);
  float m = uMorph + (aR.x - 0.5) * 0.5 * mezcla;

  vec3 g = rotX(0.42) * rotY(uTime * 0.045) * p0;
  vec3 b = rotX(0.95) * rotY(sin(uTime * 0.2) * 0.18) * p1 + vec3(0., -0.1, 0.);
  vec3 s = rotZ(sin(uTime * 0.15) * 0.05) * p2;
  vec3 f = rotZ(uTime * 0.03) * p3;
  vec3 c = p4 + vec3(sin(uTime * 0.05 + aR.y * 6.28) * 0.1, 0., 0.);

  vec3 pos = g * max(0., 1. - abs(m - 0.))
           + b * max(0., 1. - abs(m - 1.))
           + s * max(0., 1. - abs(m - 2.))
           + f * max(0., 1. - abs(m - 3.))
           + c * max(0., 1. - abs(m - 4.));
  pos += c * max(0., m - 4.);

  // turbulencia a mitad de la transformación
  vec3 ruido = vec3(sin(uTime * 0.7 + aR.y * 40.), cos(uTime * 0.6 + aR.z * 40.), sin(uTime * 0.5 + aR.x * 40.));
  pos += ruido * (0.42 * mezcla + 0.012);
  pos += normalize(pos + 0.0001) * uRafaga * (0.6 + aR.z);

  pos *= uEscala;
  pos = rotX(uGiro.y) * rotY(uGiro.x) * pos;
  pos.z -= 4.2;

  vec4 clip = uProy * vec4(pos, 1.);
  vec2 ndc = clip.xy / clip.w;
  vec2 d = (ndc - uRaton) * vec2(uAspecto, 1.);
  float l = length(d);
  float fuerza = smoothstep(0.32, 0., l) * 0.1;
  ndc += (d / (l + 0.0001)) * fuerza / vec2(uAspecto, 1.);
  clip.xy = ndc * clip.w;
  gl_Position = clip;

  float parpadeo = 0.65 + 0.35 * sin(uTime * (1. + aR.z * 2.) + aR.y * 30.);
  vBrillo = parpadeo * (1. + fuerza * 6.);
  vTono = aR.z;
  gl_PointSize = (0.7 + aR.y * aR.y * 2.6) * uPx * (4.2 / clip.w) * (1. + fuerza * 5.);
}`;

const FS = `
precision mediump float;
uniform float uAlfa;
varying float vTono, vBrillo;
void main(){
  vec2 q = gl_PointCoord - 0.5;
  float d = length(q);
  if (d > 0.5) discard;
  float a = exp(-d * d * 18.) + 0.25 * exp(-d * d * 4.);
  vec3 oro = vec3(0.91, 0.765, 0.416);
  vec3 hueso = vec3(0.97, 0.92, 0.8);
  vec3 peri = vec3(0.55, 0.62, 0.9);
  vec3 col = vTono < 0.55 ? mix(oro, hueso, vTono / 0.55) : mix(hueso, peri, (vTono - 0.55) / 0.45);
  float alfa = a * vBrillo * uAlfa;
  gl_FragColor = vec4(col * alfa, alfa);
}`;

function perspectiva(fov, asp, cerca, lejos) {
  const f = 1 / Math.tan(fov / 2), nf = 1 / (cerca - lejos);
  return new Float32Array([f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (lejos + cerca) * nf, -1, 0, 0, 2 * lejos * cerca * nf, 0]);
}

export function crearCosmos(canvas, { quieto = false } = {}) {
  const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: "high-performance" });
  if (!gl) return null;

  const compilar = (tipo, src) => {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  try {
    gl.attachShader(prog, compilar(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) {
    console.warn("cosmos:", e);
    return null;
  }
  gl.useProgram(prog);

  const movil = Math.min(innerWidth, innerHeight) < 700;
  const N = movil ? 6500 : 15000;
  const datos = FORMAS.map((forma) => {
    const a = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) a.set(forma(i, N), i * 3);
    return a;
  });
  const azar = new Float32Array(N * 3);
  for (let i = 0; i < N * 3; i++) azar[i] = Math.random();

  const atributo = (nombre, arr) => {
    const loc = gl.getAttribLocation(prog, nombre);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
  };
  datos.forEach((d, k) => atributo("p" + k, d));
  atributo("aR", azar);

  const U = {};
  ["uMorph", "uTime", "uPx", "uEscala", "uRafaga", "uAspecto", "uRaton", "uGiro", "uProy", "uAlfa"].forEach((n) => (U[n] = gl.getUniformLocation(prog, n)));

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.disable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);

  const estado = {
    morph: 0, meta: 0,
    alfa: 0, metaAlfa: 1,
    raton: [9, 9], ratonMeta: [9, 9],
    giro: [0, 0], giroMeta: [0, 0],
    rafaga: 0, pausa: false, t0: performance.now()
  };
  let px = 1, asp = 1;

  function medir() {
    px = Math.min(devicePixelRatio || 1, 2);
    const w = innerWidth, h = innerHeight;
    canvas.width = Math.round(w * px);
    canvas.height = Math.round(h * px);
    asp = w / h;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniformMatrix4fv(U.uProy, false, perspectiva(0.9, asp, 0.1, 50));
    gl.uniform1f(U.uPx, px);
    gl.uniform1f(U.uAspecto, asp);
    gl.uniform1f(U.uEscala, asp < 1 ? Math.max(0.62, asp * 1.05) : 1);
  }
  medir();
  addEventListener("resize", medir);

  addEventListener("pointermove", (e) => {
    estado.ratonMeta = [(e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1)];
    estado.giroMeta = [estado.ratonMeta[0] * 0.22, -estado.ratonMeta[1] * 0.12];
  }, { passive: true });
  document.addEventListener("pointerleave", () => (estado.ratonMeta = [9, 9]));

  let ultimo = performance.now();
  function cuadro(ahora) {
    requestAnimationFrame(cuadro);
    if (estado.pausa || document.hidden) return;
    const dt = Math.min((ahora - ultimo) / 1000, 0.05);
    ultimo = ahora;
    const k = 1 - Math.pow(0.001, dt * 0.55);
    estado.morph += (estado.meta - estado.morph) * k;
    estado.alfa += (estado.metaAlfa - estado.alfa) * (1 - Math.pow(0.001, dt * 0.8));
    estado.rafaga *= Math.pow(0.02, dt);
    for (let j = 0; j < 2; j++) {
      estado.raton[j] += (estado.ratonMeta[j] - estado.raton[j]) * (1 - Math.pow(0.0001, dt));
      estado.giro[j] += (estado.giroMeta[j] - estado.giro[j]) * (1 - Math.pow(0.01, dt));
    }
    const t = quieto ? 0 : (ahora - estado.t0) / 1000;
    gl.uniform1f(U.uMorph, estado.morph);
    gl.uniform1f(U.uTime, t);
    gl.uniform1f(U.uRafaga, estado.rafaga);
    gl.uniform1f(U.uAlfa, estado.alfa);
    gl.uniform2f(U.uRaton, estado.raton[0], estado.raton[1]);
    gl.uniform2f(U.uGiro, estado.giro[0], estado.giro[1]);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, N);
  }
  requestAnimationFrame(cuadro);

  return {
    forma(m) { estado.meta = Math.max(0, Math.min(4, m)); },
    alfa(a) { estado.metaAlfa = a; },
    rafaga(f = 1) { estado.rafaga = Math.max(estado.rafaga, f); },
    pausar(p) { estado.pausa = p; if (!p) ultimo = performance.now(); },
    saltar(m) { estado.morph = estado.meta = m; }
  };
}
