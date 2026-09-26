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
| `/` | `index.html` | Home horizontal. FR por defecto, EN/ES, claro/oscuro. Parámetros `?lang= &a=sofia\|alex\|tomas &niche= &n=` |
| `/demo/` | `demo/index.html` | Dashboard generalizado: Aperçu, Appels, Messages, Courriel, Agenda, Briefings, Réseaux, Contacts y chat con la asistente. `?v=immobilier` redirige a `/immobilier/demo/` |
| `/immobilier/` | `immobilier/index.html` | Landing para courtiers (Alex, adjunto personal). Tiene el bloque OACIQ. |
| `/immobilier/demo/` | `immobilier/demo/index.html` | Dashboard inmobiliario original, con la marca unificada |
| `/dental/`, `/barbiers/`, `/garages/` | **faltan en el repo** | Solo existen en Netlify. Hay que traerlos antes de cambiar el DNS. |
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
- Retell no hace llamadas en frío. Las salientes van solo a clientes con consentimiento (briefings).
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
  - "20+ langues" debe coincidir con lo que la configuración de Retell soporte de verdad. Verificarlo.
- **Dashboard:**
  - gráfica apilada por canal (con tooltip y vista de tabla) y gráfica de línea con crosshair, siguiendo la guía de dataviz;
  - vista de semana en la agenda;
  - tarjetas de Langues e Intégrations en la pestaña de la asistente.

## Pendientes conocidos
- Traer `/dental`, `/barbiers` y `/garages` al repo y alinear marca y precios.
- Actualizar el agente de Retell de la línea demo para que se presente como **Sofía, asistente personal**, no como recepcionista inmobiliario, porque la home dice "Parler à Sofía".
- Tarea 5 (backend del briefing): diseño listo en `docs/briefing-backend.md`. Hay que implementarlo en Make, Retell y Supabase.
- `presentation.html` es una página vieja en inglés, con precios y teléfonos antiguos. No está enlazada; hay que borrarla o actualizarla.
