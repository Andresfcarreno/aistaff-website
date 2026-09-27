// Lectura base, calculada en el navegador.
// Se usa cuando la función del servidor no está disponible (vista previa,
// sin clave de API, sin conexión). Es honesta sobre lo que es: una lectura
// de los números, no el análisis profundo que escribe IO.

import { perfil } from "./numerologia.js";
import { recomendar, porRomano, areaDe } from "./catalogo.js";

export const SIGNIFICADOS = {
  1: { arquetipo: "El que abre camino", esencia: "Viniste a iniciar. Tu energía es la del primer paso: decidir, ir adelante, sostener una idea propia aunque nadie la haya pedido.", sombra: "Cuando no te sientes visto, te endureces. Confundes independencia con no pedir nunca ayuda, y cargas solo lo que podría compartirse.", don: "la iniciativa" },
  2: { arquetipo: "El que une", esencia: "Tu energía es la del vínculo. Percibes lo que otros no dicen, lees el ambiente antes de entrar, y sabes sostener a la gente sin hacer ruido.", sombra: "Te adaptas tanto que a veces desapareces. Callas lo que necesitas para que no haya conflicto, y luego te duele que nadie lo haya adivinado.", don: "la sensibilidad" },
  3: { arquetipo: "El que expresa", esencia: "Viniste a poner en palabras, en imágenes, en voz. Tu energía crea, comunica, contagia — cuando estás bien, la gente se ilumina a tu lado.", sombra: "Cuando algo duele, lo cubres con humor o con dispersión. Empiezas mucho y terminas poco, porque terminar obliga a mostrarte.", don: "la expresión" },
  4: { arquetipo: "El que construye", esencia: "Tu energía es estructura. Sabes poner una piedra sobre otra, sostener lo que empiezas y darle forma a lo que otros solo imaginan.", sombra: "El control se vuelve refugio. Si no está todo en orden, no te permites descansar — y te cuesta confiar en lo que no puedes planear.", don: "la constancia" },
  5: { arquetipo: "El que se mueve", esencia: "Viniste a experimentar. Tu energía es cambio, libertad, curiosidad: aprendes viviendo, no leyendo sobre la vida.", sombra: "Cuando algo se pone serio, sientes que te encierra. Huyes hacia lo siguiente antes de terminar de vivir lo que tienes delante.", don: "la libertad" },
  6: { arquetipo: "El que cuida", esencia: "Tu energía es hogar y responsabilidad. Donde llegas, ordenas, proteges y sostienes. La gente descansa en ti.", sombra: "Cuidas tanto que te olvidas. Das para que te quieran, y cuando no te devuelven lo mismo, lo cobras en silencio.", don: "el amor que sostiene" },
  7: { arquetipo: "El que busca", esencia: "Viniste a preguntar por qué. Tu energía es análisis, profundidad, búsqueda interior. No te conformas con la versión fácil de nada.", sombra: "Te refugias en la cabeza. Analizas lo que deberías sentir, y te aíslas justo cuando más necesitarías que alguien te acompañe.", don: "la comprensión" },
  8: { arquetipo: "El que materializa", esencia: "Tu energía es poder de concreción. Sabes mover recursos, liderar y convertir una intención en resultado tangible.", sombra: "El valor propio queda atado a lo que logras. Si no produces, sientes que no vales — y el dinero se vuelve medida de todo.", don: "la autoridad" },
  9: { arquetipo: "El que cierra y entrega", esencia: "Viniste a completar. Tu energía es compasión amplia, visión de conjunto, capacidad de entender a casi cualquiera.", sombra: "Te cuesta soltar. Cargas historias que ya terminaron, y das a todos lo que no te das a ti.", don: "la compasión" },
  11: { arquetipo: "El canal", esencia: "Número maestro. Tu energía es intuición intensa: percibes antes de saber, y tu presencia inspira aunque no hagas nada especial.", sombra: "Tanta sensibilidad sin tierra se vuelve ansiedad. Dudas de lo que percibes, y la tensión te agota.", don: "la intuición" },
  22: { arquetipo: "El arquitecto", esencia: "Número maestro. Tu energía es la de construir algo que te sobreviva: visión grande con capacidad real de llevarla a tierra.", sombra: "La escala de lo que ves te paraliza. Si no puede ser enorme, a veces prefieres no empezar.", don: "la visión que se construye" },
  33: { arquetipo: "El maestro que sirve", esencia: "Número maestro. Tu energía es amor que enseña: sanas acompañando, y tu ejemplo pesa más que tus palabras.", sombra: "Te sacrificas hasta vaciarte. Sientes que tu valor está en salvar a otros.", don: "el servicio" }
};

const AREA_TEXTO = {
  dinero: "El dinero casi nunca es sobre dinero. Es sobre permiso: permiso para recibir, para cobrar lo que vale lo que haces, para no sentir culpa cuando algo te sale bien.",
  relaciones: "Las relaciones son el espejo más directo que existe. Lo que se repite con distintas personas no habla de ellas: habla del lugar desde donde tú eliges, esperas y te quedas.",
  proposito: "Cuando el propósito se siente trabado, rara vez es falta de talento. Suele ser una voz vieja que te dice qué es aceptable querer, y cuánto te está permitido brillar.",
  emocional: "Tu mundo emocional no está roto: está sobrecargado. Hay cosas que sentiste y no pudiste procesar, y siguen ocupando espacio aunque ya no las mires.",
  familia: "La familia es la primera escuela y el primer idioma. Lo que se traba ahí no se resuelve cambiando a los demás, sino viendo qué papel te dieron y cuál todavía sigues cumpliendo."
};

const PORQUE = {
  I: (c) => `Porque lo que describiste como un patrón no es mala suerte: responde a reglas. Este libro te da el mapa de esas reglas para que dejes de jugar a ciegas.`,
  II: (c) => c.herida ? `Porque la frase que escribiste — «${c.herida}» — es una idea que alguien sembró en tu mente. Este libro explica cómo se instala una etiqueta y cómo se desarma desde la raíz.` : `Porque antes de cambiar lo de afuera hay que ver qué historia te estás contando por dentro. Esta es la ley base de todas las demás.`,
  III: (c) => `Porque lo que quieres cambiar en tu relación con ${c.areaCorta} necesita método, no solo intención. Aquí hay 21 días de práctica concreta.`,
  IV: (c) => `Porque tu Camino de Vida ${c.camino} explica mucho de lo que leíste aquí. Este es el libro para entender tus propios números sin depender de nadie.`,
  V: (c) => c.herida ? `Porque lo que escribiste en la última pregunta no es un defecto de carácter: es una ausencia que nunca se nombró. Este libro le pone nombre.` : `Porque mucho de lo que se traba en la familia viene de quién estuvo y quién no. Este libro nombra ese duelo que nadie enseña a llorar.`,
  VI: (c) => `Porque lo que se te repite en las relaciones pide aprender a salir de un vínculo sin romperte — y sin llevarte el mismo patrón a la siguiente.`,
  VII: (c) => `Porque parte de lo que sientes trabado se sostiene en creencias que parecen verdades. Este libro las mira con calma, una por una.`,
  VIII: (c) => `Porque tu bloqueo con el dinero probablemente tiene raíz en otra forma de abundancia que falta. Aquí están las cuatro, y cómo se construyen.`,
  IX: (c) => c.patron ? `Porque lo que describiste — «${c.patron}» — tiene la forma de algo que no terminó de cerrarse. Lo que no se cierra, se repite.` : `Porque lo que no se cierra se repite. Este libro te enseña a reconocer lo que ya terminó y soltarlo con dignidad.`,
  X: (c) => `Porque sientes que estás empezando otra vez, y eso no es volver a cero: es volver a uno, con todo lo que ya sabes.`
};

function corta(t, n = 90) {
  const s = String(t || "").trim().replace(/\s+/g, " ");
  if (!s || s === "no especificado") return "";
  return s.length > n ? s.slice(0, n).replace(/\s\S*$/, "") + "…" : s;
}

const primerNombre = (n) => String(n || "").trim().split(/\s+/)[0] || "";

export function lecturaLocal(A) {
  const p = perfil(A);
  const cv = p.camino?.valor ?? 1;
  const dv = p.destino?.valor ?? 1;
  const av = p.alma?.valor ?? 1;
  const pv = p.personalidad?.valor ?? 1;
  const S = (n) => SIGNIFICADOS[n] || SIGNIFICADOS[1];
  const area = areaDe(A.area);
  const areaCorta = (A.area || "tu vida").replace(/^Mi |^Las |^El /, "").toLowerCase();
  const patron = corta(A.patron, 110);
  const herida = corta(A.herida, 110);
  const nombre = primerNombre(A.apodo && A.apodo !== "no especificado" ? A.apodo : A.nombre);

  const numeros = [
    { nombre: "Camino de vida", valor: String(cv) },
    { nombre: "Destino", valor: String(dv) },
    { nombre: "Alma", valor: String(av) },
    { nombre: "Personalidad", valor: String(pv) }
  ];
  if (p.anio) numeros.push({ nombre: "Año personal", valor: String(p.anio.valor) });

  const linaje = [];
  if (p.padre) linaje.push(`La línea de tu padre vibra en ${p.padre.valor} — ${S(p.padre.valor).arquetipo.toLowerCase()}.`);
  if (p.madre) linaje.push(`La de tu madre, en ${p.madre.valor} — ${S(p.madre.valor).arquetipo.toLowerCase()}.`);
  if (p.padre && p.madre) {
    linaje.push(p.padre.valor === cv || p.madre.valor === cv
      ? `Fíjate: tu Camino de Vida repite el número de uno de los dos. Hay algo de esa historia que viniste a continuar — o a transformar.`
      : `Ninguno de los dos comparte tu Camino de Vida. Eso suele sentirse como haber crecido hablando otro idioma dentro de tu propia casa.`);
  }

  const apodoTxt = p.apodo && p.apodo.valor !== dv
    ? `El nombre con el que te llaman los tuyos vibra en ${p.apodo.valor}, no en ${dv}. En lo cotidiano vives más cerca de ${S(p.apodo.valor).don} que de ${S(dv).don}: una versión tuya que los demás conocen y que tu nombre de papel todavía no incluye.`
    : `El nombre con el que vives y el del papel cuentan la misma historia. Lo que eres en tu registro es lo que la gente cercana ya reconoce en ti.`;

  const capitulos = [
    {
      etiqueta: "Quién eres",
      titulo: `${nombre ? nombre + ", " : ""}${S(cv).arquetipo.toLowerCase()}`,
      parrafos: [
        `Tu Camino de Vida es ${cv}. ${S(cv).esencia}`,
        p.sol ? `Naciste con el Sol en ${p.sol.nombre}, un signo de ${p.sol.elemento.toLowerCase()}. ${elemento(p.sol.elemento)} Esa es la textura con la que vives tu número: no la contradice, le da temperatura.` : `Tu fecha marca el tono con el que vives todo lo demás.`
      ],
      frase: `Tu don es ${S(cv).don}. Tu trabajo es no esconderlo.`
    },
    {
      etiqueta: "Tu nombre y tu linaje",
      titulo: `Un nombre que suma ${dv}`,
      parrafos: [
        `Tu nombre completo reduce a ${dv}: ${S(dv).arquetipo.toLowerCase()}. Es la dirección hacia la que tu vida empuja, lo que viniste a desarrollar aunque no siempre lo elijas. ${apodoTxt}`,
        linaje.length ? linaje.join(" ") : `Elegiste no nombrar a tu linaje, y eso también dice algo: hay historias que todavía se guardan con cuidado. No hace falta abrirlas hoy para saber que están ahí.`
      ],
      frase: `Tu nombre no es una etiqueta: es una dirección.`
    },
    {
      etiqueta: "Cómo te ven y cómo eres",
      titulo: av === pv ? "Por dentro y por fuera, lo mismo" : `Afuera ${pv}, adentro ${av}`,
      parrafos: [
        `Tu Personalidad — lo que la gente percibe antes de conocerte — es ${pv}: ${S(pv).arquetipo.toLowerCase()}. Tu Alma — lo que de verdad te mueve — es ${av}: ${S(av).arquetipo.toLowerCase()}.`,
        av === pv
          ? `Lo que muestras y lo que sientes coinciden, y eso es raro. El riesgo es que la gente crea que ya te conoce entera o entero, y deje de preguntar.`
          : `Esa distancia explica por qué a veces te sientes malinterpretado. La gente responde a tu ${pv}, pero lo que necesitas es que alguien vea tu ${av}: ${S(av).don}.`
      ],
      frase: av === pv ? "Lo que ves es lo que hay." : "Te conocen por la puerta, no por la casa."
    },
    {
      etiqueta: A.area || "Lo que se traba",
      titulo: `Lo que se traba en ${areaCorta}`,
      parrafos: [
        AREA_TEXTO[area?.id] || AREA_TEXTO.emocional,
        `Con un Camino de Vida ${cv}, el bloqueo suele tomar esta forma: ${S(cv).sombra.charAt(0).toLowerCase() + S(cv).sombra.slice(1)}`
      ],
      frase: `No está trabado: está esperando que lo mires de frente.`
    },
    {
      etiqueta: "La raíz del patrón",
      titulo: "Lo que se repite",
      parrafos: [
        patron ? `Escribiste: «${patron}». Léelo otra vez, despacio, como si lo hubiera escrito alguien que quieres.` : `Lo que se repite rara vez se ve desde adentro. Por eso vuelve.`,
        `Un patrón no es un castigo: es una pregunta que vuelve hasta que se responde. Tu número de Destino, ${dv}, sugiere que la respuesta pasa por ${S(dv).don}. Cada repetición trae la misma invitación con otra cara.`
      ],
      frase: "Lo que no se nombra, se repite."
    },
    {
      etiqueta: "La frase de la infancia",
      titulo: herida ? "Lo que todavía cargas" : "Lo que decidiste guardar",
      parrafos: herida
        ? [`Te dijeron: «${herida}». Un niño no tiene cómo defenderse de una frase así: la guarda como una verdad sobre sí mismo.`, `Hoy esa frase ya no habla con la voz de quien la dijo. Habla con la tuya. Y esa es la buena noticia: lo que se instaló en tu mente, en tu mente se puede desarmar.`]
        : [`Pasaste esta pregunta, y está bien. A veces lo que más pesa es justo lo que todavía no se puede escribir.`, `Cuando estés listo o lista, vuelve a ella. No para revivirla, sino para ver cuánto de tu presente sigue organizado alrededor de esa frase.`],
      frase: "La voz que te juzga no es tuya. Solo aprendiste a usarla."
    },
    {
      etiqueta: "Qué hacer con todo esto",
      titulo: p.anio ? `Tu año personal ${p.anio.valor}` : "El siguiente paso",
      parrafos: [
        p.anio ? `Estás atravesando un año personal ${p.anio.valor}. ${ANIO[p.anio.valor] || ""}` : `Empieza por una sola cosa, no por todas.`,
        `Tres pasos concretos: escribe tu patrón en una hoja y al lado la frase de la infancia — busca dónde se tocan. Durante siete días, nota cada vez que se repite, sin juzgarlo. Y lee los tres libros que te dejo abajo, en el orden en que aparecen.`
      ],
      frase: "Ver la raíz ya es empezar a cambiarla."
    }
  ];

  const rec = recomendar(A.area, A.herida);
  const ctx = { camino: cv, patron, herida: corta(A.herida, 60), areaCorta };
  const libros = rec.romanos.map((r) => {
    const l = porRomano(r);
    return { numero: r, titulo: l.titulo, porque: PORQUE[r](ctx) };
  });

  return { numeros, capitulos, libros, local: true };
}

function elemento(e) {
  return {
    Fuego: "El fuego empuja, arde rápido y necesita movimiento.",
    Tierra: "La tierra necesita sentir que pisa firme antes de soltarse.",
    Aire: "El aire piensa, conecta, necesita espacio para respirar.",
    Agua: "El agua siente primero y entiende después."
  }[e] || "";
}

const ANIO = {
  1: "Es un año de sembrar: lo que empieces ahora marca los próximos nueve. No es momento de esperar permiso.",
  2: "Es un año lento y de vínculos. Lo que se construye ahora se construye con otros, y con paciencia.",
  3: "Es un año de expresión. Lo que calles este año pesa el doble; lo que digas, se multiplica.",
  4: "Es un año de trabajo y cimientos. Poco brillo, mucha estructura — y eso es exactamente lo que necesitas.",
  5: "Es un año de cambio. Algo se mueve aunque no lo elijas; mejor elegir hacia dónde.",
  6: "Es un año de hogar y responsabilidad. La familia y los compromisos piden atención — también el compromiso contigo.",
  7: "Es un año de introspección. Menos hacia afuera, más hacia adentro: es tiempo de entender, no de acelerar.",
  8: "Es un año de cosecha y poder personal. Lo que construiste pide que lo reclames.",
  9: "Es un año de cierre. Lo que no vas a llevar al siguiente ciclo, suéltalo ahora — con gratitud."
};
