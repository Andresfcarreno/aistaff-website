// Numerología pitagórica + signo solar.
// Módulo puro (sin DOM): lo usa la página y también la función del servidor,
// para que los números que ve la persona y los que recibe IO sean los mismos.

const TABLA = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
  "Ñ": 5
};
const VOCALES = new Set(["A", "E", "I", "O", "U"]);
const MAESTROS = new Set([11, 22, 33]);

// Quita tildes pero conserva la Ñ.
export function letras(texto) {
  return String(texto || "")
    .toUpperCase()
    .replace(/Ñ/g, "\u0000")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\u0000/g, "Ñ")
    .split("")
    .filter((c) => TABLA[c] !== undefined);
}

export function valorLetra(c) {
  return TABLA[c] || 0;
}

export function esVocal(c) {
  return VOCALES.has(c);
}

// Reduce a un dígito respetando 11, 22 y 33. Devuelve también los pasos,
// para poder animar la reducción en pantalla.
export function reducir(n) {
  const pasos = [n];
  while (n > 9 && !MAESTROS.has(n)) {
    n = String(n).split("").reduce((s, d) => s + Number(d), 0);
    pasos.push(n);
  }
  return { valor: n, pasos };
}

function sumaLetras(texto, filtro) {
  return letras(texto)
    .filter(filtro || (() => true))
    .reduce((s, c) => s + TABLA[c], 0);
}

export function destino(nombre) {
  const total = sumaLetras(nombre);
  return total ? reducir(total) : null;
}

export function alma(nombre) {
  const total = sumaLetras(nombre, esVocal);
  return total ? reducir(total) : null;
}

export function personalidad(nombre) {
  const total = sumaLetras(nombre, (c) => !esVocal(c));
  return total ? reducir(total) : null;
}

// Acepta "AAAA-MM-DD" (lo que devuelve <input type="date">).
export function partesFecha(fecha) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(fecha || "").trim());
  if (!m) return null;
  const anio = Number(m[1]), mes = Number(m[2]), dia = Number(m[3]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  return { anio, mes, dia };
}

// Camino de vida: día, mes y año se reducen por separado y luego se suman.
export function caminoDeVida(fecha) {
  const p = partesFecha(fecha);
  if (!p) return null;
  const d = reducir(p.dia).valor, m = reducir(p.mes).valor, a = reducir(p.anio).valor;
  const r = reducir(d + m + a);
  return { ...r, partes: { dia: d, mes: m, anio: a } };
}

export function anioPersonal(fecha, anioActual) {
  const p = partesFecha(fecha);
  if (!p) return null;
  const d = reducir(p.dia).valor, m = reducir(p.mes).valor, a = reducir(anioActual).valor;
  let n = d + m + a;
  while (n > 9) n = String(n).split("").reduce((s, x) => s + Number(x), 0);
  return { valor: n };
}

const SIGNOS = [
  { nombre: "Capricornio", desde: [12, 22], elemento: "Tierra", glifo: "♑" },
  { nombre: "Acuario", desde: [1, 20], elemento: "Aire", glifo: "♒" },
  { nombre: "Piscis", desde: [2, 19], elemento: "Agua", glifo: "♓" },
  { nombre: "Aries", desde: [3, 21], elemento: "Fuego", glifo: "♈" },
  { nombre: "Tauro", desde: [4, 20], elemento: "Tierra", glifo: "♉" },
  { nombre: "Géminis", desde: [5, 21], elemento: "Aire", glifo: "♊" },
  { nombre: "Cáncer", desde: [6, 21], elemento: "Agua", glifo: "♋" },
  { nombre: "Leo", desde: [7, 23], elemento: "Fuego", glifo: "♌" },
  { nombre: "Virgo", desde: [8, 23], elemento: "Tierra", glifo: "♍" },
  { nombre: "Libra", desde: [9, 23], elemento: "Aire", glifo: "♎" },
  { nombre: "Escorpio", desde: [10, 23], elemento: "Agua", glifo: "♏" },
  { nombre: "Sagitario", desde: [11, 22], elemento: "Fuego", glifo: "♐" }
];

export function signoSolar(fecha) {
  const p = partesFecha(fecha);
  if (!p) return null;
  const clave = p.mes * 100 + p.dia;
  let signo = SIGNOS[0];
  for (const s of SIGNOS.slice(1)) {
    if (clave >= s.desde[0] * 100 + s.desde[1]) signo = s;
  }
  if (clave >= 1222) signo = SIGNOS[0];
  return signo;
}

// Todo junto, en el formato que usan la página y el servidor.
export function perfil({ nombre, apodo, fecha, padre, madre }, anioActual = new Date().getFullYear()) {
  const valido = (t) => t && t !== "no especificado";
  return {
    camino: caminoDeVida(fecha),
    destino: destino(nombre),
    alma: alma(nombre),
    personalidad: personalidad(nombre),
    apodo: valido(apodo) ? destino(apodo) : null,
    padre: valido(padre) ? destino(padre) : null,
    madre: valido(madre) ? destino(madre) : null,
    anio: anioPersonal(fecha, anioActual),
    sol: signoSolar(fecha)
  };
}
