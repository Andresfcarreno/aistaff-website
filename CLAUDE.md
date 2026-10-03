# AI Staff (meetaistaff.com): contexto para Claude Code

## Quién y qué
- **Dueño:** Andrés Carreño, emprendedor solo en Montreal.
  - Habla ES/EN y **no habla francés**: todo el copy FR debe salir listo.
  - Quiere entregables completos, no instrucciones.
- **Producto:** AI Staff, una asistente personal con IA (voz propia trilingüe FR/EN/ES: Twilio + Claude, con Supabase y un Worker de Cloudflare) más un dashboard por cliente.
  - Posicionamiento (sept. 2026): **"Votre prochaine employée est une IA."** Se vende a la persona ocupada, no a la empresa.
  - Personas: **Sofía** (por defecto), **Alex** y **Tomás**.
- **Stack:** Twilio (+1 438-805-8804, línea demo), Claude API, Supabase (proyecto `vqvdmcxkkmkyxpfnxmzo`: tablas, Edge Functions `voice`, `lead-notify` y `messages-in`, pg_cron), Cloudflare Worker `voice-relay`, Make.com (plan Free: onboarding) y Resend. **Ya no se usa Vapi ni Retell.**
  - **Cómo funciona la línea demo (confirmado el 3 oct. 2026):** Twilio llama a la función `voice` de Supabase; esta pasa la llamada al Worker `voice-relay` de Cloudflare (ConversationRelay: Deepgram + ElevenLabs + Claude Haiku 4.5). Si el relay falla, `voice` sigue sola por turnos (`<Gather>` + voces Google). Al colgar, el cron `voice-sweep` analiza la llamada (tabla `calls`) y, si la persona está interesada, crea un **lead** (`ref = appel-demo`).
  - **El prompt de Sofía está en dos lugares y debe ser igual:** `voice-relay/src/prompt.ts` (el que se oye) y `supabase/functions/voice/index.ts` (respaldo, con etiquetas `[[LANG:xx]]`). El relay se publica solo al hacer merge a `main` (Cloudflare Workers Builds); `voice` se publica con `deploy_edge_function`.
  - **Aviso de leads:** cron `lead-notify` (cada minuto, solo si hay leads sin avisar) → función `lead-notify` → correo por Resend y/o SMS por Twilio. Secretos: ver `docs/BITACORA.md`.
  - Detalle: `docs/voz-propia.md`, `docs/make-supabase.md`.
- **Meta de negocio:** cerrar clientes de unos 1 000 $/mes. Cada tarea debe acercar a un cliente que pague.

## Estructura del sitio (estático, sin build)
| Ruta | Archivo | Notas |
|---|---|---|
| `/` | `index.html` (**generado**: `python3 tools/build_sectors.py`) | Página principal = el sector "general" de la misma plantilla de los sectores (celular flotante, dashboard de muestra, calculadora empleado vs. AI Staff, integraciones, planes y preguntas). Contenido FR/EN/ES en `tools/general_content.py`. FR por defecto, EN/ES, claro/oscuro. Parámetros `?lang= &a=sofia\|alex\|tomas`. |
| `/demo/` | `demo/index.html` | Dashboard generalizado: Aperçu, Appels, Messages, Courriel, Agenda, Briefings, Réseaux, Contacts y chat con la asistente. `?v=immobilier` redirige a `/immobilier/demo/` |
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

## Página principal (general) y sectores
- La home ya no es una página aparte: es el sector **"general"** de `tools/build_sectors.py`, así que **se ve igual que las páginas de sector** (3 de octubre de 2026). Texto en `tools/general_content.py`; precios y textos comunes en `tools/generic_text.py`.
- **Dashboard de muestra con 6 pestañas intercambiables** (Aperçu con gráfica semanal, Appels con transcripción, Messages, Agenda semanal, Réseaux, Contacts), armado desde los datos de cada sector; rótulos en `tools/dash_text.py`. Datos siempre marcados como demostración.
- Secciones: hero con celular flotante y llamada de ejemplo, problema y qué hace, 4 funciones, **calculadora** (cuánto cuesta un empleado que contesta el teléfono frente a AI Staff), cómo funciona, **dashboard de muestra**, **integraciones** (logos), **3 planes**, preguntas y cierre.
- La calculadora general usa `mode: "human"`: horas por semana × salario por hora × 4,33. Los valores iniciales son solo ejemplos; la cifra de 3 500 a 4 500 $ de una asistente humana sigue siendo una estimación.
- La home v2 anterior se conserva en `tools/home_source.html` solo como fuente de estilos y efectos del generador. La home "simple" de planes que existió el 2 de octubre se eliminó.
- **Siluetas de persona:** son SVG propios (`avatarSVG`): Sofía femenina; Alex neutra con anillo arcoíris sutil; Tomás masculina.
- **Idiomas:** los tres planes hablan FR, EN y ES. "20+ langues" ya no se usa.
- **Dashboard** (`/demo/`): gráfica apilada por canal, gráfica de línea con crosshair, vista de semana en la agenda, tarjetas de Langues e Intégrations.

## Dashboard: consola de voz
- Al pulsar "Écouter" (briefings, llamadas, chat) se abre una consola a pantalla completa:
  - nebulosa WebGL;
  - anillo de barras radiales que se mueve con la voz;
  - subtítulos palabra por palabra.
- Usa la voz del navegador (speechSynthesis) si hay una disponible; si no, sigue con tiempos simulados.

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
- Activar el aviso de leads: poner `RESEND_API_KEY` (correo) y/o `TWILIO_ACCOUNT_SID` + `NOTIFY_PHONE` (SMS) en los secretos de Edge Functions de Supabase.
- Tarea 5 (backend del briefing): diseño listo en `docs/briefing-backend.md`. Conviene implementarlo con Edge Functions de Supabase (como `voice`) en vez de Make; requiere la tabla `clients`.
