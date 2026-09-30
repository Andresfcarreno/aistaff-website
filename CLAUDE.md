# AI Staff (meetaistaff.com): contexto para Claude Code

## Quién y qué
- **Dueño:** Andrés Carreño, emprendedor solo en Montreal.
  - Habla ES/EN y **no habla francés**: todo el copy FR debe salir listo.
  - Quiere entregables completos, no instrucciones.
- **Producto:** AI Staff, una asistente personal con IA (voz propia trilingüe FR/EN/ES: Twilio + Claude en una Edge Function de Supabase) más un dashboard por cliente.
  - Posicionamiento (sept. 2026): **"Votre prochaine employée est une IA."** Se vende a la persona ocupada, no a la empresa.
  - Personas: **Sofía** (por defecto), **Alex** y **Tomás**.
- **Stack:** Twilio (+1 438-805-8804, línea demo; voz Polly y reconocimiento de voz), Claude API, Supabase (proyecto `vqvdmcxkkmkyxpfnxmzo`: tablas, Edge Function `voice`, pg_cron), Make.com (plan Free: onboarding) y Resend. **Ya no se usa Vapi ni Retell.**
  - Voz de la línea demo: `docs/voz-propia.md` (código en `supabase/functions/voice/index.ts`; el prompt de Sofía vive ahí). Make y Supabase: `docs/make-supabase.md`.
- **Meta de negocio:** cerrar clientes de unos 1 000 $/mes. Cada tarea debe acercar a un cliente que pague.

## Estructura del sitio (estático, sin build)
| Ruta | Archivo | Notas |
|---|---|---|
| `/` | `index.html` | Home horizontal. FR por defecto, EN/ES, claro/oscuro. Parámetros `?lang= &a=sofia\|alex\|tomas &niche= &n=` |
| `/demo/` | `demo/index.html` | Dashboard generalizado: Aperçu, Appels, Messages, Courriel, Agenda, Briefings, Réseaux, Contacts y chat con la asistente. `?v=immobilier` redirige a `/immobilier/demo/` |
| `/immobilier/demo/` | `immobilier/demo/index.html` | Dashboard inmobiliario original, con la marca unificada |
| `/immobilier/`, `/cvc/`, `/paysagement/`, `/deneigement/`, `/garages/`, `/nettoyage/`, `/barbiers/`, `/dental/` | **generadas**, no se editan a mano | Plantilla común en `tools/build_sectors.py`, que toma el CSS, el orbe y los avatares de `index.html`. El contenido FR/EN/ES está en `tools/sectors_*.py` y `generic_text.py`. Después de cambiar la home o el contenido: `python3 tools/build_sectors.py` (también inyecta `HOME_SECTORS` en la home: menú, pestañas y banda). |
| `404.html`, `CNAME`, `.nojekyll`, `robots.txt`, `sitemap.xml` | | Configuración de GitHub Pages |
| `docs/` | | `DEPLOY.md`, `briefing-backend.md`, `guiones-video.md` |
| `backend/supabase/` | | SQL de briefings |

**Deploy:** GitHub Pages desde `main` (ver `docs/DEPLOY.md`). Merge a `main` = publicado.

## Sistema visual
Toma como referencia `immobilier/index.html` (navy `#0A1A33`, azul `#1F6FEB`, tarjetas redondeadas, tema claro/oscuro con la clave `aistaff-theme` en localStorage).
- Un solo archivo HTML autocontenido por página, mobile-first.
- Todo el texto en un diccionario `STR` / `U` / `D` con claves FR/EN/ES.

## Precios (CAD, mes a mes, sin contrato, instalación gratis en el lanzamiento)
| Plan FR / EN / ES | Precio |
|---|---|
| Assistante / Assistant / Asistente | 997 $ |
| **Exécutive / Executive / Ejecutiva** (destacado) | 1 497 $ |
| Dédiée / Dedicated / Dedicada | 2 497 $ |

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

## Home v2 (efectos y secciones)
- **Hero:** orbe WebGL propio (sin librerías) que "late" cuando habla la asistente. El teléfono se inclina en 3D con el mouse, hay tarjetas flotantes y una línea que va rotando los canales.
- **Siluetas de persona:** son SVG propios (`avatarSVG`):
  - Sofía, femenina;
  - Alex, neutra, con un anillo arcoíris sutil;
  - Tomás, masculina.
- **Logos oficiales:** vienen de Simple Icons (CC0), embebidos como `LOGOS`. Outlook no está en Simple Icons, así que se usa un ícono genérico de sobre.
- **Idiomas por plan:** Assistante 3, Exécutive hasta 5, Dédiée todas.
  - "20+ langues" debe coincidir con lo que la voz soporte de verdad; hoy la línea demo habla solo FR/EN/ES. Verificarlo.
- **Dashboard:**
  - gráfica apilada por canal (con tooltip y vista de tabla) y gráfica de línea con crosshair, siguiendo la guía de dataviz;
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
  - Envío: `ONBOARDING_WEBHOOK` apunta al escenario de Make "AI Staff onboarding → Supabase leads", que guarda cada envío en la tabla `leads`. Si el POST falla, la página ofrece mailto a hello@ y descarga JSON.
  - Todos los CTA "Réserver ma démo" (home y sectores) apuntan aquí.
- `/confidentialite/`: política de privacidad Ley 25 (FR/EN/ES). La persona responsable es Andrés. Tiene la tabla de subcontratistas.
- `docs/legal/`: contrato de servicio y entente de démo (FR/EN, docx+pdf) más `LEEME.md` (checklist Ley 25, que hay que hacer revisar por un abogado de Quebec).
  - Se generan con `tools/legal/*.js` (npm `docx`).
- `docs/onboarding-playbook.md`: proceso completo y plantillas de correo/SMS FR/EN.
- `marketing/flyers/`: flyers carta (PNG 3x + PDF) y cuadrados 1080 (FR/EN, general e immobilier). Los QR llevan a `/onboarding/?ref=flyer`.
  - Regenerar: `NODE_PATH=<node_modules con playwright+qrcode> node tools/flyers/build.js`.

## Pendientes conocidos
- Aviso por correo de cada lead nuevo: agregar un módulo Gmail en el escenario de onboarding (ver `docs/make-supabase.md`).
- Completar NEQ, dirección, TPS/TVQ en los contratos (`tools/legal/`) y hacerlos revisar.
- Activar la voz propia (`docs/voz-propia.md`): poner `ANTHROPIC_API_KEY` y `TWILIO_AUTH_TOKEN` en los secretos de Supabase, liberar el número en Vapi y apuntar el webhook de voz de Twilio a la función `voice`.
- Tarea 5 (backend del briefing): diseño listo en `docs/briefing-backend.md`. Conviene implementarlo con Edge Functions de Supabase (como `voice`) en vez de Make; requiere la tabla `clients`.
