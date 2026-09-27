# Andrés OS — centro de mando personal

Panel privado de Andrés Carreño: los 5 frentes (Trading FTUK, AIStaff, Soy Andrés Carreño, IO, Prime Ménage),
pilares de vida, agenda, trading y memoria, con Claude como asistente de voz. La cara es una nebulosa de
partículas (WebGL) que se forma en un rostro cuando escucha y habla.

Un solo archivo (`index.html`), sin build. Funciona de dos maneras:

| | Versión instalada (`meetaistaff.com/andres-os/`) | Versión claude.ai (Artifact) |
|---|---|---|
| Cerebro | Tu API key de Anthropic (Ajustes) | Tu cuenta de Claude, sin key |
| Te escucha | Micrófono + palabra de activación («Jarvis», «Claude») | Solo texto (claude.ai no permite micrófono) |
| Voz | ElevenLabs (tu voz clonada) o voz del navegador | Voz del navegador |
| Datos | Este navegador (+ respaldo JSON) | Nube privada de tu cuenta, sincroniza entre dispositivos |
| Calendario, llamadas, sesiones | — | Google Calendar, llamadas de ElevenLabs, sesiones de Claude Code |

## Puesta en marcha (versión instalada)

1. Publica el sitio en Netlify como siempre; la página queda en `/andres-os/` con `noindex`.
2. Ábrela en **Chrome o Edge** (el reconocimiento de voz de Safari es limitado).
3. ⚙️ Ajustes → **Anthropic API key**. Se guarda solo en ese dispositivo y solo viaja a `api.anthropic.com`.
   Modelo por defecto: Claude Opus 5 con profundidad «rápida» para respuestas de voz ágiles.
4. Voz propia: ⚙️ → Motor de voz **ElevenLabs** → pega tu API key de ElevenLabs y el **Voice ID** de tu voz clonada.
5. Toca el ícono de la oreja para la **escucha continua** y di: «Jarvis, ¿cómo voy hoy?».
   Después de responder queda escuchando 8 segundos para que sigas sin repetir la palabra.

## Qué le puedes pedir

- «Jarvis, ¿en qué me enfoco hoy?»
- «Anota en Prime Ménage: llamar a la agencia de limpiadoras, prioridad alta»
- «Marca como hecho el DNS de Ionos»
- «Registra un trade de +150, seguí el plan, me sentí tranquilo»
- «Llamé a mamá» · «Dormí 6 horas y fui al gym»
- «Recuerda que los lunes no opero»
- «Ponte en naranja» / «modo claro»

## Datos

El estado vive en `localStorage` (`andres-os:v1`). Ajustes → Exportar/Importar respaldo para moverlo entre equipos.
Las claves de API nunca se incluyen en respaldos ni en la sincronización.
