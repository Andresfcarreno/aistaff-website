# AI Staff (meetaistaff.com): contexto para Claude Code

## Quién y qué
- **Dueño:** Andrés Carreño, emprendedor solo en Montreal.
  - Habla ES/EN y **no habla francés**: todo el copy FR debe salir listo.
  - Quiere entregables completos, no instrucciones.
- **Producto:** AI Staff, una asistente personal con IA (voz propia trilingüe FR/EN/ES: Twilio + Claude, con Supabase y un Worker de Cloudflare) más un dashboard por cliente.
  - Posicionamiento (sept. 2026): **"Votre prochaine employée est une IA."** Se vende a la persona ocupada, no a la empresa.
  - Personas: **Sofía** (por defecto; es el nombre de la línea demo, y la publicidad nueva dirá Sofía), **Alex** y **Tomás**. **No cambiar el prompt ni la voz de la línea demo** sin que el dueño lo pida.
- **Stack:** Twilio (+1 438-805-8804, línea demo), Claude API, Supabase (proyecto `vqvdmcxkkmkyxpfnxmzo`: tablas, Edge Functions `voice`, `lead-notify`, `client-setup`, `messages-in`, `messages-out` y `assistant`, pg_cron), Cloudflare Worker `voice-relay`, Make.com (plan Free: onboarding) y Resend. **Ya no se usa Vapi ni Retell.**
  - **Cómo funciona la línea demo (confirmado el 3 oct. 2026):** Twilio llama a la función `voice` de Supabase; esta pasa la llamada al Worker `voice-relay` de Cloudflare (ConversationRelay: Deepgram + ElevenLabs + Claude Haiku 4.5). Si el relay falla, `voice` sigue sola por turnos (`<Gather>` + voces Google). Al colgar, el cron `voice-sweep` analiza la llamada (tabla `calls`) y, si la persona está interesada, crea un **lead** (`ref = appel-demo`).
  - **El prompt de Sofía está en dos lugares y debe ser igual:** `voice-relay/src/prompt.ts` (el que se oye) y `supabase/functions/voice/index.ts` (respaldo, con etiquetas `[[LANG:xx]]`). El relay se publica solo al hacer merge a `main` (Cloudflare Workers Builds); `voice` se publica con `deploy_edge_function`.
  - **Aviso de leads:** cron `lead-notify` (cada minuto, solo si hay leads sin avisar) → función `lead-notify` → correo por Resend y/o SMS por Twilio. Secretos: ver `docs/BITACORA.md`.
  - **Clientes:** cada negocio es una fila de `tenants` (su número de Twilio, guion `business_info`, saludo, celular del dueño). Alta automática desde el formulario con la función `client-setup` (`docs/alta-cliente.md`). Las citas pedidas por teléfono van a `bookings` (`requested`) y salen en la agenda del panel.
  - Detalle: `docs/voz-propia.md`, `docs/make-supabase.md`.
- **Meta de negocio:** cerrar clientes de unos 1 000 $/mes. Cada tarea debe acercar a un cliente que pague.

## Estructura del sitio (estático, sin build)
| Ruta | Archivo | Notas |
|---|---|---|
| `/` | `index.html` (**generado**: `python3 tools/build_sectors.py`) | Página principal **sencilla** (4 oct. 2026): plantilla `tools/home_template.html`; los planes, precios y la lista de sectores se inyectan desde `tools/generic_text.py` y `tools/sectors_*.py`. Hero con el **mismo orbe de la consola de voz de `/demo/`** (nebulosa WebGL + anillo de barras de voz; código copiado de `demo/index.html`: `glNebula`, `hudState`, `hudDraw`). Botón principal **«Appeler Sofía maintenant»** (tel:) y franja «Appelez Sofía. Pour vrai.» con el número grande y un **código QR** (`tools/qr_demo_line.svg`, se inyecta al generar); en celular, barra fija para llamar. «Écouter un exemple» (o clic en el orbe) reproduce una llamada de ejemplo **general** (pedir cita el sábado, sirve para cualquier negocio) con la voz del navegador, subtítulos palabra por palabra y al final notificaciones tipo celular (texto al dueño y aviso del tablero). Luego: cómo funciona (3 pasos), qué hace (hoy / por fases), **calculadora** empleado vs. AI Staff (horas × salario × 4,33; textos en `tools/general_content.py`), 3 planes, sectores, **el dashboard real en vivo** (`/demo/?embed=1` en un iframe dentro de una ventana estilo Mac, escalado en escritorio y en versión celular en móvil), preguntas y cierre. FR por defecto, EN/ES, claro/oscuro, `?lang= &a=sofia\|alex\|tomas`. |
| `/demo/` | `demo/index.html` | **Dashboard nuevo (oct. 2026), estilo Mac claro/plateado.** Barra lateral + 8 vistas: Accueil, Appels, Messages, Courriels, Agenda, Contacts, la asistente (Sofía) y Réglages. Demo con datos de ejemplo o **datos reales** al iniciar sesión (enlace mágico). Ver la sección «Dashboard». `?lang= &a= &n=Nombre` ; `#calls`, `#msgs`… abren una vista; `?v=immobilier` redirige a `/immobilier/demo/` |
| `/immobilier/demo/` | `immobilier/demo/index.html` | Dashboard inmobiliario original, con la marca unificada |
| `/immobilier/`, `/cvc/`, `/paysagement/`, `/deneigement/`, `/garages/`, `/nettoyage/`, `/barbiers/`, `/dental/` | **generadas**, no se editan a mano | Plantilla común en `tools/build_sectors.py`, que toma el CSS, el orbe y los avatares de `tools/home_source.html` (la home v2 anterior, conservada solo como fuente de estilos). El contenido FR/EN/ES está en `tools/sectors_*.py` y `generic_text.py`. Después de cambiar la home o el contenido: `python3 tools/build_sectors.py` (genera también la página principal). |
| `404.html`, `CNAME`, `.nojekyll`, `robots.txt`, `sitemap.xml` | | Configuración de GitHub Pages |
| `docs/` | | `DEPLOY.md`, `briefing-backend.md`, `guiones-video.md` |
| `backend/supabase/` | | SQL de briefings |

**Deploy:** GitHub Pages desde `main` (ver `docs/DEPLOY.md`). Merge a `main` = publicado.

## Sistema visual
Toma como referencia `immobilier/index.html` (navy `#0A1A33`, azul `#1F6FEB`, tarjetas redondeadas, tema claro/oscuro con la clave `aistaff-theme` en localStorage).
- Un solo archivo HTML autocontenido por página, mobile-first.
- Todo el texto en un diccionario `STR` / `U` / `D` con claves FR/EN/ES.

## Precios (CAD, mes a mes, sin contrato, instalación gratis en el lanzamiento)
| Plan FR / EN / ES | Precio (+ impuestos) | Incluye |
|---|---|---|
| Essentiel / Essential / Esencial | 397 $ | Número dedicado, llamadas 24/7 (FR/EN/ES), SMS, citas en agenda, dashboard privado, llamar a la asistente para pedir reportes |
| Pro | 597 $ | Todo lo anterior, más WhatsApp (por fases), llamadas programadas de la asistente al dueño, hasta 3 por día (por fases), llamadas ilimitadas con uso razonable |
| Complet / Complete / Completo | 797 $ | Todo lo anterior, más Instagram y Facebook y métricas de redes (por fases) y acceso prioritario |

Tres planes iguales en jerarquía visual (ninguno "destacado"). El correo no está en los planes. No se menciona a un humano de respaldo. Los precios se venden **+ taxes** (TPS 5 % y TVQ 9,975 %).

Nota obligatoria: "Déploiement progressif : les canaux s'activent par phases et sont confirmés lors de l'appel découverte."

## Reglas de copy (no negociables)
- Marca: **"AI Staff"**, nunca "Aistaff", "AIStaff" ni "MeetAIstaff".
- No usar "Jarvis".
- **Nada de estadísticas sin fuente.** El costo de una asistente humana (≈ 3 500–4 500 $/mes) va siempre como "estimación".
- Nada de fotos de stock de personas: usar orbe o iniciales.
- **Honestidad:**
  - Hoy funcionan llamadas, SMS y agenda. WhatsApp, DMs, correo y briefings van marcados "Par phases".
  - No prometer plazos de activación.
  - No afirmar "cumplimiento Ley 25": solo describir prácticas (acceso revocable, datos no revendidos, supervisión humana).
- Quebec: el francés es el idioma por defecto (Ley 96).
- Inmobiliario: la IA **nunca** da consejo de corretaje (OACIQ).
- La asistente no hace llamadas en frío. Las salientes van solo a clientes con consentimiento (briefings).
- Nunca poner claves API en el HTML. Todo pasa por Make o por una función serverless.
- Contacto: hello@meetaistaff.com · +1 (438) 805-8804.

## Página principal y sectores
- **Orbe y chat (8 oct. 2026):** el orbe de la home es el mismo de la página del curso (icosfera + barras de voz + nebulosa, clase `Core`), dentro del círculo oscuro sobrio. Abajo a la derecha hay un **chat con Sofía** (FR/EN/ES, estilo Mac, sigue el tema claro/oscuro) que usa la función `curso-chat` con `bot: "sofia"`; las conversaciones quedan en la tabla `course_chat` (columna `bot`).
- **Home sencilla (4 oct. 2026):** el dueño la quiso más vacía y entendible, con un orbe llamativo que hable. Texto en el diccionario `STR` de `tools/home_template.html`; planes y precios vienen de `tools/generic_text.py` (no se escriben a mano). La demo de voz es un ejemplo con la voz del navegador y lo dice; la voz real es la de la línea demo.
- La asistente del ejemplo **nunca confirma** la cita: dice que el equipo confirma por texto (igual que la voz real de los clientes).
- **Páginas de sector:** siguen con el diseño completo (celular flotante, dashboard de muestra con 6 pestañas, calculadora, integraciones). De `tools/general_content.py` solo se usa la calculadora (`calc`).
- **Siluetas de persona:** son SVG propios (`avatarSVG`): Sofía femenina; Alex neutra con anillo arcoíris sutil; Tomás masculina.
- **Idiomas:** los tres planes hablan FR, EN y ES. "20+ langues" ya no se usa.

## Dashboard (`/demo/`, oct. 2026)
- **Un solo archivo** `demo/index.html` (sin build). Estilo Mac: aluminio claro (`--bg #ECEEF2`), grafito en oscuro, tarjetas blancas, barra lateral translúcida, ⌘K para buscar. Colores de canal: SMS verde, WhatsApp `#00A884`, Instagram degradado, Messenger `#0866FF`. Paleta de gráficas validada: `--s1/--s2/--s3` (azul, naranja, verde).
- **Textos:** diccionario `T` (FR/EN/ES) y `BT` (complementos). La persona sale de `?a=` o de Réglages (`aistaff-persona`); el nombre del dueño de `?nom=` o de Réglages (`aistaff-owner`).
- **Accueil:** «Bonjour [nombre]» con el **orbe** (nebulosa WebGL + anillo de barras, el mismo de la home). En la tarjeta solo se ve un adelanto de 2 líneas; clic en el orbe o «Écouter le brief» abre un **pop-out** con el orbe grande que lo lee en voz alta, palabra por palabra. «Nouveau brief» lo genera (en vivo: función `assistant`, se guarda en `briefs`); «Historique» los lista. Luego 4 KPIs con minigráficas, actividad 14 días (barras apiladas, tooltip y vista de tabla), «À traiter», mapa de calor (día × hora), motivos de llamada, idiomas y la agenda de hoy. El «temps libéré» es una **estimación** (4 min por llamada, 2 por mensaje) y lo dice.
- **Appels / Messages / Courriels:** vista dividida (lista + detalle), sin scroll largo: resumen de la asistente arriba y la conversación con su propio scroll. Messages = bandeja unificada con pestañas de color; responder por SMS/WhatsApp usa `messages-out` (en vivo); Instagram/Facebook «par phases». Courriels: «Sofía dit…» + 3 respuestas sugeridas (en vivo: `assistant` action `email`) que llenan el borrador; se envía con «Ouvrir dans ma messagerie» (mailto), el envío directo es «par phases».
- **Agenda:** 7 días desde hoy (como Calendrier), eventos lado a lado si se cruzan, línea de la hora actual, minicalendario del mes y «Demandes à confirmer» (las citas `requested`: **el dueño confirma**, nunca la asistente).
- **Contacts:** se arman solos con cada llamada, mensaje y correo; ficha con historial y formulario (en vivo se guarda en la tabla `contacts` vía `assistant` action `contact`).
- **Asistente (Sofía):** chat del dueño con su asistente. En vivo usa la función `assistant` (action `chat`) con los datos reales del negocio; en demo responde con un motor local de ejemplo y lo dice. Tarjetas: llamarla al número, «Appels programmés» (Pro, **par phases**, interruptores desactivados) y lo que puede hacer.
- **Réglages:** nombre, persona, idiomas (FR/EN/ES activos; otros «sur demande»), conexiones (en vivo solo dicen «Connecté» si llegan datos), forfait (397/597/797) y privacidad.
- **Consola de voz** (Réécouter una llamada): pantalla completa con la nebulosa, barras que se mueven con la voz y subtítulos palabra por palabra; voz del navegador si hay, si no tiempos simulados.
- **Función `assistant`** (`supabase/functions/assistant/index.ts`, Claude con salida JSON para correos): acciones `chat`, `brief`, `email`, `contact`. Auth: token de sesión del dashboard (el tenant sale de `tenants.owner_email`) o `x-notify-key` + `tenant_id`. Solo usa los datos del negocio; no inventa, no confirma citas, no ejecuta acciones. Tablas nuevas: `briefs` y `contacts` (RLS por dueño).

## Onboarding, legal y marketing (sept. 2026)
- `/onboarding/`: formulario para prospectos (FR/EN/ES, 7 pasos, sin contraseñas). Guarda un borrador en localStorage (`aistaff-onboarding`). Acepta `?secteur=`, `?ref=` y `?lang=`.
  - Envío: `ONBOARDING_WEBHOOK` apunta al escenario de Make "AI Staff onboarding → Supabase leads", que guarda cada envío en la tabla `leads`. Si el POST falla, la página ofrece mailto a hello@ y descarga JSON.
  - Todos los CTA "Réserver ma démo" (home y sectores) apuntan aquí.
- `/confidentialite/`: política de privacidad Ley 25 (FR/EN/ES). La persona responsable es Andrés. Tiene la tabla de subcontratistas.
- `docs/legal/`: contrato de servicio y entente de démo (FR/EN, docx+pdf) más `LEEME.md` (checklist Ley 25, que hay que hacer revisar por un abogado de Quebec).
  - Se generan con `tools/legal/*.js` (npm `docx`).
- `docs/onboarding-playbook.md`: proceso completo y plantillas de correo/SMS FR/EN.
- `marketing/flyers/`: flyers carta (PNG 3x + PDF) y cuadrados 1080 (FR/EN, general e immobilier). Los QR llevan a `/onboarding/?ref=flyer`.
  - Regenerar: `NODE_PATH=<node_modules con playwright+qrcode> node tools/flyers/build.js`.

## Línea demo adaptable (diseñada, sin implementar)
- `docs/demo-agent-retell.md`: flujo, prompt y nodos (escritos para Retell; la lógica aplica igual a la voz propia de `docs/voz-propia.md`) del agente que pregunta por el negocio de quien llama y luego actúa como su asistente; envía el enlace a `/onboarding/` por SMS (solo con consentimiento verbal). Incluye el escenario de Make y el plan por fases.
- `backend/supabase/002_demo_calls.sql`: tabla `demo_calls` (RLS sin políticas, solo service role; borrado a los 12 meses).

## Bitácora y estado (léela antes de continuar)
- **`docs/BITACORA.md`**: qué se hizo hasta el 3 oct. 2026, decisiones del dueño (precios 397/597/797 + impuestos), estado de Supabase y Make, lo que no se pudo hacer y los pendientes en orden.

## Pendientes conocidos
- Completar NEQ, dirección, TPS/TVQ en los contratos (`tools/legal/`) y hacerlos revisar.
- Aviso de leads: activo por correo y SMS (claves en el Vault de Supabase, 3 oct. 2026).
- Tarea 5 (backend del briefing): diseño listo en `docs/briefing-backend.md`. Conviene implementarlo con Edge Functions de Supabase (como `voice`) en vez de Make; requiere la tabla `clients`.
