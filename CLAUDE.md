# AI Staff (meetaistaff.com): contexto para Claude Code

## Quién y qué
- **Dueño:** Andrés Carreño, emprendedor solo en Montreal.
  - Habla ES/EN y **no habla francés**: todo el copy FR debe salir listo.
  - Quiere entregables completos, no instrucciones.
- **Producto:** AI Staff, una asistente personal con IA (voz trilingüe FR/EN/ES sobre Retell AI) más un dashboard por cliente.
  - Posicionamiento (sept. 2026): **"Votre prochaine employée est une IA."** Se vende a la persona ocupada, no a la empresa.
  - Personas: **Sofía** (por defecto), **Alex** y **Tomás**.
- **Stack:** Retell AI, Twilio (+1 438-805-8804, línea demo), Make.com, Claude API, Supabase (multi-tenant, `dashboard_token`) y Resend.
- **Meta de negocio:** cerrar clientes de unos 1 000 $/mes. Cada tarea debe acercar a un cliente que pague.

## Estructura del sitio (estático, sin build)
| Ruta | Archivo | Notas |
|---|---|---|
| `/` | `index.html` (**generado**: `python3 tools/build_home.py`) | Home simple y limpia. FR por defecto, EN/ES, claro/oscuro. Parámetros `?lang= &a=sofia\|alex\|tomas`. Plantilla: `tools/home_template.html`; planes: `tools/plans.json`; sectores: `tools/sectors_menu.json`. |
| `/demo/` | `demo/index.html` | Dashboard generalizado: Aperçu, Appels, Messages, Courriel, Agenda, Briefings, Réseaux, Contacts y chat con la asistente. `?v=immobilier` redirige a `/immobilier/demo/` |
| `/immobilier/demo/` | `immobilier/demo/index.html` | Dashboard inmobiliario original, con la marca unificada |
| `/immobilier/`, `/cvc/`, `/paysagement/`, `/deneigement/`, `/garages/`, `/nettoyage/`, `/barbiers/`, `/dental/` | **generadas**, no se editan a mano | Plantilla común en `tools/build_sectors.py`, que toma el CSS, el orbe y los avatares de `tools/home_source.html` (la home v2 anterior, conservada solo como fuente de estilos). El contenido FR/EN/ES está en `tools/sectors_*.py` y `generic_text.py`. Después de cambiar la home o el contenido: `python3 tools/build_sectors.py` (la home nueva ya no recibe `HOME_SECTORS`). |
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
- Retell no hace llamadas en frío. Las salientes van solo a clientes con consentimiento (briefings).
- Nunca poner claves API en el HTML. Todo pasa por Make o por una función serverless.
- Contacto: hello@meetaistaff.com · +1 (438) 805-8804.

## Home (simple, estilo limpio)
- Estructura: nav, hero (titular, lead, orbe CSS, dos botones), el dolor (3 tarjetas), cómo funciona (3 pasos), qué hace la asistente (4 puntos), **3 planes**, sectores, FAQ y cierre.
- Sin marquesinas, nube de idiomas, rejilla de integraciones, pestañas automáticas ni tarjetas flotantes (retirados el 2 oct. 2026; la v2 está en `tools/home_source.html`).
- **Siluetas de persona:** son SVG propios (`avatarSVG`) en las páginas de sector y el onboarding: Sofía femenina; Alex neutra con anillo arcoíris sutil; Tomás masculina.
- **Idiomas:** los tres planes hablan FR, EN y ES. "20+ langues" ya no se usa; si se vuelve a ofrecer, verificar primero lo que soporta Retell.
- **Dashboard** (`/demo/`):
  - gráfica apilada por canal (con tooltip y vista de tabla) y gráfica de línea con crosshair;
  - vista de semana en la agenda;
  - tarjetas de Langues e Intégrations en la pestaña de la asistente.

## Dashboard: consola de voz
- Al pulsar "Écouter" (briefings, llamadas, chat) se abre una consola a pantalla completa:
  - nebulosa WebGL;
  - anillo de barras radiales que se mueve con la voz;
  - subtítulos palabra por palabra.
- Usa la voz del navegador (speechSynthesis) si hay una disponible; si no, sigue con tiempos simulados.

## Onboarding, legal y marketing (sept. 2026)
- `/onboarding/`: formulario para prospectos (FR/EN/ES, 7 pasos, sin contraseñas). Guarda un borrador en localStorage (`aistaff-onboarding`). Acepta `?secteur=`, `?ref=` y `?lang=`.
  - Envío: si `ONBOARDING_WEBHOOK` (Make) está vacío, usa mailto a hello@ más descarga JSON.
  - Todos los CTA "Réserver ma démo" (home y sectores) apuntan aquí.
- `/confidentialite/`: política de privacidad Ley 25 (FR/EN/ES). La persona responsable es Andrés. Tiene la tabla de subcontratistas.
- `docs/legal/`: contrato de servicio y entente de démo (FR/EN, docx+pdf) más `LEEME.md` (checklist Ley 25, que hay que hacer revisar por un abogado de Quebec).
  - Se generan con `tools/legal/*.js` (npm `docx`).
- `docs/onboarding-playbook.md`: proceso completo y plantillas de correo/SMS FR/EN.
- `marketing/flyers/`: flyers carta (PNG 3x + PDF) y cuadrados 1080 (FR/EN, general e immobilier). Los QR llevan a `/onboarding/?ref=flyer`.
  - Regenerar: `NODE_PATH=<node_modules con playwright+qrcode> node tools/flyers/build.js`.

## Línea demo adaptable (diseñada, sin implementar)
- `docs/demo-agent-retell.md`: flujo, prompt y nodos del agente de Retell que pregunta por el negocio de quien llama y luego actúa como su asistente; envía el enlace a `/onboarding/` por SMS (solo con consentimiento verbal). Incluye el escenario de Make y el plan por fases.
- `backend/supabase/002_demo_calls.sql`: tabla `demo_calls` (RLS sin políticas, solo service role; borrado a los 12 meses).

## Pendientes conocidos
- Webhook de Make conectado en `onboarding/index.html` (escenario "AI Staff onboarding → Supabase leads"). Falta probarlo de punta a punta con el sitio publicado.
- Completar NEQ, dirección, TPS/TVQ en los contratos (`tools/legal/`) y hacerlos revisar.
- Actualizar el agente de Retell de la línea demo para que se presente como **Sofía, asistente personal**, no como recepcionista inmobiliario, porque la home dice "Parler à Sofía". El prompt nuevo está en `docs/demo-agent-retell.md`.
- Tarea 5 (backend del briefing): diseño listo en `docs/briefing-backend.md`. Hay que implementarlo en Make, Retell y Supabase.
