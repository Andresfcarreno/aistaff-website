// El catálogo de la biblioteca y el mapa de recomendación de IO.
// Módulo puro: lo usa la página y la función del servidor.

export const LIBROS = [
  {
    n: 1, romano: "I", slug: "las-12-leyes-universales", tema: "leyes",
    titulo: "Las 12 Leyes Universales",
    corto: "Las reglas del juego que estamos jugando",
    hook: "Los principios que gobiernan tu vida, explicados sin misticismo vacío — con un ejercicio práctico por cada ley.",
    largo: "El libro ancla de la colección. Doce leyes — de la Correspondencia a la Causa y Efecto — leídas como lo que son: reglas de funcionamiento, no promesas. Cada ley viene con una forma concreta de verla en tu día y un ejercicio para trabajarla.",
    pdf: "libros/Las-12-Leyes-Universales.pdf",
    archivo: "Las 12 Leyes Universales - Andres Carreno.pdf",
    lomo: "#1b1830"
  },
  {
    n: 2, romano: "II", slug: "la-ley-del-mentalismo", tema: "leyes",
    titulo: "La Ley del Mentalismo",
    corto: "El Todo es Mente — la ley base bajo las otras once",
    hook: "El principio hermético que sostiene a las otras once leyes — \"el Todo es Mente\" — y cómo usarlo antes que cualquier otra.",
    largo: "Antes de atraer, antes de vibrar, antes de manifestar: la mente. Este libro recorre el primer principio del Kybalion y lo baja a tierra — cómo se forman las etiquetas que cargas, y cómo se desarman.",
    pdf: "libros/La-Ley-del-Mentalismo.pdf",
    archivo: "La Ley del Mentalismo - Andres Carreno.pdf",
    lomo: "#141225"
  },
  {
    n: 3, romano: "III", slug: "ley-de-la-atraccion", tema: "leyes",
    titulo: "Ley de la Atracción: Manual Práctico",
    corto: "Aplicación concreta, sin fantasía",
    hook: "De dónde viene realmente esta ley, por qué \"solo pensar\" no basta, y un método de 21 días para aplicarla.",
    largo: "La versión que nadie te contó: el origen real de la idea, por qué pensar en positivo no alcanza, y un método de 21 días que combina intención, acción y revisión honesta.",
    pdf: "libros/Ley-de-la-Atraccion-Manual-Practico.pdf",
    archivo: "Ley de la Atraccion - Andres Carreno.pdf",
    lomo: "#1f1a2c"
  },
  {
    n: 4, romano: "IV", slug: "numerologia-101", tema: "numeros",
    titulo: "Numerología 101",
    subtitulo: "Tu Número de Vida",
    corto: "Los fundamentos de tus números",
    hook: "Calcula tu número de vida, tu número de expresión y el de tu alma — con tabla completa y ejemplos.",
    largo: "La puerta de entrada a todo lo que IO calcula. La tabla pitagórica completa, los números maestros, cómo reducir sin equivocarte y qué significa cada número cuando aparece en tu vida.",
    pdf: "libros/Numerologia-101.pdf",
    archivo: "Numerologia 101 - Andres Carreno.pdf",
    lomo: "#191628"
  },
  {
    n: 5, romano: "V", slug: "creciste-sin-ellos", tema: "sanar",
    titulo: "Creciste Sin Ellos",
    corto: "Sanar la ausencia de un padre o una madre",
    hook: "Cómo sanar la ausencia de un padre o una madre — el duelo que nadie te enseñó a nombrar, y cómo dejar de repetirlo sin darte cuenta.",
    largo: "Escrito desde adentro. Crecer sin uno de los dos — o sin los dos — deja un hueco que se disfraza de carácter. Este libro le pone nombre a ese duelo y te muestra dónde lo estás repitiendo.",
    pdf: "libros/Creciste-Sin-Ellos.pdf",
    archivo: "Creciste Sin Ellos - Andres Carreno.pdf",
    lomo: "#101024"
  },
  {
    n: 6, romano: "VI", slug: "transicionar-sin-romperte", tema: "sanar",
    titulo: "Transicionar Sin Romperte",
    corto: "Salir de una separación sin perderte",
    hook: "Cómo salir de una separación larga sin perder quién eres — comunicación sin guerra, cómo proteger a tus hijos, y cómo reconstruirte desde cero.",
    largo: "Una separación larga no termina el día que alguien se va. Comunicación sin guerra, cómo proteger a los hijos del ruido, y cómo reconstruir una identidad que no dependa del otro.",
    pdf: "libros/Transicionar-Sin-Romperte.pdf",
    archivo: "Transicionar Sin Romperte - Andres Carreno.pdf",
    lomo: "#12122a"
  },
  {
    n: 7, romano: "VII", slug: "lo-que-si-es-y-lo-que-no-es", tema: "vida",
    titulo: "Lo Que Sí Es y Lo Que No Es",
    corto: "Mitos contra realidad",
    hook: "Tres creencias que damos por ciertas — la suerte, la positividad, la ocupación — y lo que hay detrás de cada una cuando se miran con calma.",
    largo: "La suerte, el positivismo obligatorio y la costumbre de estar siempre ocupado. Tres ideas que parecen inofensivas y que, miradas con calma, explican mucho de lo que se te traba.",
    pdf: "libros/Lo-Que-Si-Es-y-No-Es.pdf",
    archivo: "Lo Que Si Es y No Es - Andres Carreno.pdf",
    lomo: "#15132a"
  },
  {
    n: 8, romano: "VIII", slug: "la-verdadera-abundancia", tema: "vida",
    titulo: "La Verdadera Abundancia",
    corto: "Abundancia más allá del dinero",
    hook: "El dinero es solo una de cuatro formas de abundancia. Cómo se construyen las otras tres — y por qué sin ellas, el dinero no alcanza.",
    largo: "Material, mental, emocional y relacional. Cuatro formas de abundancia que se sostienen entre sí — y por qué cuando falta una, el dinero nunca parece suficiente.",
    pdf: "libros/La-Verdadera-Abundancia.pdf",
    archivo: "La Verdadera Abundancia - Andres Carreno.pdf",
    lomo: "#17142b"
  },
  {
    n: 9, romano: "IX", slug: "el-arte-de-cerrar-ciclos", tema: "vida",
    titulo: "El Arte de Cerrar Ciclos",
    corto: "Soltar con dignidad",
    hook: "Cómo reconocer cuándo algo ya terminó, y soltarlo con dignidad — antes de que te siga costando energía en silencio.",
    largo: "Lo que no se cierra se repite. Cómo reconocer que algo ya terminó aunque nadie lo haya dicho, y cómo cerrarlo sin rencor y sin dejar la puerta a medias.",
    pdf: "libros/El-Arte-de-Cerrar-Ciclos.pdf",
    archivo: "El Arte de Cerrar Ciclos - Andres Carreno.pdf",
    lomo: "#141128"
  },
  {
    n: 10, romano: "X", slug: "volver-a-empezar", tema: "vida",
    titulo: "Volver a Empezar",
    corto: "Todo cierre real es un comienzo",
    hook: "Por qué todo cierre real es, en el fondo, un comienzo — y cómo dar el primer paso sin necesitar tenerlo todo resuelto.",
    largo: "El libro que cierra la primera vuelta de diez. Empezar de nuevo no es volver a cero: es volver a uno, con todo lo que ya sabes. Cómo dar el primer paso sin tener el mapa completo.",
    pdf: "libros/Volver-a-Empezar.pdf",
    archivo: "Volver a Empezar - Andres Carreno.pdf",
    lomo: "#131026"
  }
];

export const TEMAS = [
  { id: "todos", nombre: "Todos" },
  { id: "leyes", nombre: "Las leyes" },
  { id: "numeros", nombre: "Los números" },
  { id: "sanar", nombre: "Sanar" },
  { id: "vida", nombre: "La vida real" }
];

export const AREAS = [
  { id: "dinero", texto: "El dinero", glifo: "◈", libros: ["VIII", "III"] },
  { id: "relaciones", texto: "Las relaciones", glifo: "∞", libros: ["VI", "IX"] },
  { id: "proposito", texto: "Mi propósito o mi trabajo", glifo: "△", libros: ["I", "X"] },
  { id: "emocional", texto: "Mi mundo emocional", glifo: "◯", libros: ["II", "VII"] },
  { id: "familia", texto: "Mi familia", glifo: "⌂", libros: ["V", "IX"] }
];

// Señales en la pregunta 11 (la herida). Se buscan sin tildes y en minúscula.
const SENALES = [
  { libro: "V", motivo: "ausencia", claves: ["papa", "padre", "mama", "madre", "abandon", "se fue", "no estaba", "ausen", "nunca estuvo", "me dejo", "me dejaron", "abuela", "abuelo", "huerfan"] },
  { libro: "II", motivo: "etiqueta", claves: ["no sirves", "no puedes", "no vales", "inutil", "tonto", "tonta", "burro", "burra", "bruto", "bruta", "nunca vas", "no eres capaz", "no vas a", "eres un", "eres una", "flojo", "floja", "no sabes", "no sirve", "estupid", "fea", "feo", "gordo", "gorda", "debil"] },
  { libro: "IX", motivo: "cierre", claves: ["termin", "cerrar", "pendiente", "perdon", "murio", "muerte", "divorci", "separ", "nunca hablamos", "no me despedi", "quedo"] },
  { libro: "X", motivo: "cero", claves: ["empezar", "de cero", "otra vez", "perdi todo", "volver", "nada de lo que", "nada sirve", "no terminas"] }
];

const plano = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function porRomano(r) {
  return LIBROS.find((l) => l.romano === String(r).trim().toUpperCase());
}

export function porTitulo(t) {
  const p = plano(t);
  return LIBROS.find((l) => plano(l.titulo) === p || p.includes(plano(l.titulo)) || plano(l.titulo).includes(p));
}

export function areaDe(texto) {
  return AREAS.find((a) => a.texto === texto) || null;
}

export function senalHerida(herida) {
  const h = plano(herida);
  if (!h || h === "no especificado") return null;
  for (const s of SENALES) if (s.claves.some((c) => h.includes(c))) return s;
  return null;
}

// Uno por el área trabada, uno por la herida, y Numerología 101 siempre.
export function recomendar(area, herida) {
  const a = areaDe(area) || AREAS[3];
  const s = senalHerida(herida);
  const elegidos = [a.libros[0]];
  const segundo = s && !elegidos.includes(s.libro) && s.libro !== "IV" ? s.libro : a.libros[1];
  elegidos.push(segundo);
  if (!elegidos.includes("IV")) elegidos.push("IV");
  return { romanos: elegidos.slice(0, 3), senal: s ? s.motivo : null };
}
