# AI Staff: guía completa del proyecto

> Documento de entrada. Explica qué es AI Staff, cómo está construido el sitio, qué hace cada página, qué variables hay y cómo seguir trabajando en él. Estado al **28 de septiembre de 2026**.

---

## 1. El negocio en una página

| | |
|---|---|
| **Marca** | **AI Staff**. Siempre escrito así: nunca "Aistaff", "AIStaff" ni "MeetAIstaff". |
| **Dominio** | meetaistaff.com |
| **Dueño** | Andrés Carreño, emprendedor en Montreal (Quebec). Habla español e inglés, no francés. |
| **Contacto público** | hello@meetaistaff.com · +1 (438) 805-8804 (línea demo con la asistente IA) |
| **Qué vende** | Una asistente personal con IA que contesta llamadas y SMS 24/7, agenda citas, hace seguimientos y (por fases) maneja correo, WhatsApp, DMs y briefings de voz. Incluye un dashboard por cliente. |
| **Posicionamiento** | **« Votre prochaine employée est une IA. »** (Your next employee is an AI.) Se le vende a la persona ocupada (dueño de negocio, courtier, profesional), no a la gran empresa. |
| **Mercado** | Quebec. El francés es el idioma por defecto (Ley 96), con EN y ES disponibles. |
| **Meta** | Cerrar clientes de alrededor de 1 000 $/mes. Toda tarea debe acercar a un cliente que pague. |

### Personas de la asistente
| ID | Nombre | Género | Uso |
|---|---|---|---|
| `sofia` | Sofía | femenina | **Por defecto** en todo el sitio |
| `alex` | Alex | neutro (formas FR "adjoint·e"); su silueta lleva un anillo arcoíris sutil | Por defecto en la página de courtiers inmobiliarios |
| `tomas` | Tomás | masculino | Opción |

No hay fotos de personas: solo siluetas SVG propias (función `avatarSVG`/`avatar`) o un orbe.

### Precios (CAD, mes a mes, sin contrato, instalación gratis durante el lanzamiento, taxes aparte)
| Plan FR / EN / ES | Precio/mes | Idiomas | Contenido |
|---|---|---|---|
| Assistante / Assistant / Asistente | **997 $** | hasta 3 | Llamadas y SMS 24/7, citas, dashboard |
| **Exécutive / Executive / Ejecutiva** (plan destacado) | **1 497 $** | hasta 5 | Todo lo anterior, más seguimientos, briefings y canales adicionales por fases |
| Dédiée / Dedicated / Dedicada | **2 497 $** | todos | Todo lo anterior, más configuración a medida y soporte prioritario |

Nota obligatoria cerca de los precios: **« Déploiement progressif : les canaux s'activent par phases et sont confirmés lors de l'appel découverte. »**

### Reglas de contenido (no negociables)
1. **Nada de estadísticas sin fuente.** El costo de una asistente humana (≈ 3 500–4 500 $/mes) siempre se presenta como **estimación**.
2. **Honestidad sobre lo que funciona hoy:** llamadas, SMS y agenda. WhatsApp, DMs, correo y briefings van marcados **« Par phases »**. No se prometen plazos de activación.
3. **No se afirma « conforme à la Loi 25 ».** Solo se describen prácticas: acceso revocable, datos no revendidos, supervisión humana.
4. **Inmobiliario:** la IA nunca da consejo de corretaje (regla OACIQ). Precio, ofertas y contratos se transfieren al courtier.
5. **Sin llamadas en frío.** Las llamadas salientes van solo a personas con relación o consentimiento (por ejemplo, el briefing al propio dueño).
6. **Nunca claves API en el HTML.** Todo lo que necesite claves pasa por Make.com o por una función serverless.
7. No usar la palabra "Jarvis".
8. El copy en francés tiene que salir listo para publicar, porque el dueño no habla francés.

### Stack técnico del producto
| Pieza | Uso |
|---|---|
| **Vapi** | Voz de la asistente (llamadas entrantes y, más adelante, briefings salientes), trilingüe FR/EN/ES. Usa ElevenLabs (voz), Soniox (transcripción) y GPT-4.1 (conversación). Prompt: `docs/vapi-asistente-sofia.md` |
| **Twilio** | Números de teléfono y SMS (+1 438-805-8804 es la línea demo) |
| **Make.com** | Automatizaciones: webhooks, orquestación de briefings, formularios |
| **Claude API (Anthropic)** | Redacción de briefings y resúmenes |
| **Supabase** | Base de datos multi-cliente (tenant por `client_id` y `dashboard_token`) con RLS |
| **Resend** | Envío de correos |
| **GitHub Pages** | Hosting del sitio estático, publicado desde la rama `main` |

---

## 2. Arquitectura del sitio

- **HTML estático sin build.** Cada página es un solo archivo `index.html` autocontenido (CSS y JS dentro), mobile-first. No hay framework ni dependencias externas en tiempo de ejecución, ni siquiera fuentes externas.
- **Idiomas:** FR por defecto; EN y ES con el parámetro `?lang=en` o `?lang=es`. Todo el texto vive en diccionarios JS por idioma (`STR` en la home; `D` y `U` en el dashboard; `T` en onboarding; `P` en privacidad).
- **Tema claro/oscuro:** clave `aistaff-theme` en `localStorage` y atributo `data-theme` en `<html>`. Si no hay preferencia guardada, se usa la del sistema.
- **Sistema visual:**
  - navy `#0A1A33`, azul `#1F6FEB` y cian `#22B8E6` para los degradados;
  - tarjetas redondeadas (radio de 18 a 24 px) y tipografía del sistema (`-apple-system`, Segoe UI, Roboto).
  - La página de referencia es `immobilier/index.html` o la home.
- **Logos de integraciones:** vienen de Simple Icons (licencia CC0), embebidos como objeto `LOGOS = {clave:[título, colorHex, pathSVG]}`. Outlook no está en Simple Icons, así que usa un ícono genérico de sobre.

### Mapa de URLs
| URL | Archivo | Qué es |
|---|---|---|
| `/` | `index.html` | Home v2 (la página principal) |
| `/demo/` | `demo/index.html` | Dashboard de demostración general |
| `/immobilier/demo/` | `immobilier/demo/index.html` | Dashboard de demostración inmobiliario |
| `/immobilier/` | generado | Landing para courtiers inmobiliarios (persona Alex, bloque OACIQ) |
| `/cvc/` | generado | Chauffage & climatisation (HVAC) |
| `/paysagement/` | generado | Paisajismo |
| `/deneigement/` | generado | Quitanieves |
| `/garages/` | generado | Talleres mecánicos |
| `/nettoyage/` | generado | Limpieza |
| `/barbiers/` | generado | Barberías y salones |
| `/dental/` | generado | Clínicas dentales |
| `/onboarding/` | `onboarding/index.html` | Formulario para prospectos (paso previo a la demo personalizada) |
| `/confidentialite/` | `confidentialite/index.html` | Política de privacidad (Ley 25) |
| `404.html`, `CNAME`, `.nojekyll`, `robots.txt`, `sitemap.xml` | | Configuración de GitHub Pages. `robots.txt` bloquea `/demo/` y `/immobilier/demo/`. |

### Parámetros de URL
| Parámetro | Dónde | Valores | Efecto |
|---|---|---|---|
| `lang` | todas | `fr` (por defecto), `en`, `es` | Idioma |
| `a` | home, dashboard, sectores | `sofia`, `alex`, `tomas` | Persona de la asistente |
| `n` | home, dashboard | un nombre, por ejemplo `?n=Julie` | Nombre del visitante en el briefing y el dashboard (por defecto "Marie") |
| `niche` | home | `immobilier`, `cvc`, `paysagement`, `deneigement`, `garages`, `nettoyage`, `barbiers`, `dental` (alias `dentiste`), `metiers`, `pro`, `createur`, `maison` | Preselecciona la pestaña "Pour qui" |
| `v` | `/demo/` | `immobilier` | Redirige a `/immobilier/demo/` |
| `#pestaña` | `/demo/` | `#appels`, `#messages`, `#email`, `#agenda`, `#briefings`, `#reseaux`, `#contacts`, `#assistant` | Abre esa pestaña del dashboard |
| `secteur` (o `sector`) | `/onboarding/` | mismos valores de sector, más `sante`, `pro`, `coach`, `metiers`, `autre` | Preselecciona el sector en el formulario |
| `ref` | `/onboarding/` | texto libre, por ejemplo `flyer`, `instagram` | Origen del prospecto; viaja con las respuestas |

Ejemplo para un anuncio: `https://meetaistaff.com/?lang=es&niche=dentiste&n=Andrea#pour-qui`

---

## 3. La home (`index.html`)

La página se recorre de arriba abajo en este orden:
1. **Nav:**
   - logo;
   - menú desplegable **Secteurs** (`#ddSectors` / `#ddMenu`) que lleva a las 8 páginas de sector;
   - selector FR/EN/ES y botón de tema;
   - botón « 📞 Parler à Sofía » (`tel:`).
2. **Hero:**
   - titular « Votre prochaine employée est une IA. », animado palabra por palabra;
   - **orbe WebGL propio** (shader de ruido fbm, sin librerías) que "late" cuando habla la asistente;
   - teléfono que se inclina en 3D con el mouse (`initTilt`);
   - tarjetas flotantes alrededor (`.fcard s0..s3`) y una línea que rota los canales (`#rot1`);
   - chips de persona con avatar;
   - botones « Réserver ma démo » (lleva a `/onboarding/`) y « Parler à {a} ».
3. **Banda de industrias:** dos marquesinas en movimiento (`#indRow1`/`#indRow2`). Las tarjetas de sector enlazan a su página.
4. **Comparación:** asistente humana (estimación) contra AI Staff.
5. **Canales:** llamadas, SMS, agenda, correo, WhatsApp, DMs, briefings, cada uno con viñetas concretas y la etiqueta « Par phases » donde corresponde.
6. **Integraciones:** logos oficiales en marquesina más una rejilla (`#intGrid`): Google Calendar, Outlook, Apple Calendar, Gmail, WhatsApp, Instagram, Facebook, Calendly, etc.
7. **Idiomas:** nube de saludos orbitando (`#langCloud`, `.hello`) y niveles por plan (`#langTiers`: 3, 5 o todos).
8. **Cómo funciona:** línea de tiempo.
9. **Pour qui:**
   - pestañas por nicho que avanzan solas cada 7 segundos;
   - los nichos de sector los inyecta el generador (`HOME_SECTORS`);
   - se suman pro, créateur, métiers y maison.
10. **Mini dashboard** de muestra.
11. **Confianza y privacidad:** prácticas, sin afirmar cumplimiento.
12. **Precios:** las 3 tarjetas, más un modal que se abre al elegir un plan.
13. **FAQ.**
14. **CTA final.**
15. **Footer:** enlaces a sectores, demo y privacidad.

**Funciones JS principales:** `avatarSVG(id)`, `logoSVG(k)`, `initOrb()`/`orbState`, `initTilt()`, `initReveal()` (aparición al hacer scroll, con respaldo), `buildBands()`, `buildLanguages()`, `tickRotator`, `tickFcards`, `splitTitle`, `scheduleNiche`, `applyStatic()`.

**Variables y constantes:** `STR` (textos por idioma), `EXTRA` (textos añadidos en la v2), `PERSONAS`, `GENDER` (`{sofia:"f", alex:"n", tomas:"m"}`), `ADJ`/`YOUR` (concordancias de género en FR), `HELLOS`, `LOGOS`, `ICON`, `CH_ICO`.

**Marcadores en los textos:**
- `{a}`: nombre de la persona;
- `{n}`: nombre del visitante;
- `{adj}`: adjointe, adjoint o adjoint·e según el género;
- `{role}`, `{the}`, `{your}`: artículos con concordancia;
- `{aud}`: público del nicho.

**Bloque generado:** entre `/*SECTORS:start*/` y `/*SECTORS:end*/` está `HOME_SECTORS`, que escribe `tools/build_sectors.py`. No se edita a mano.

---

## 4. El dashboard de demo (`/demo/`)

Simula el panel que ve un cliente. **Todos los datos son de ejemplo** y así lo dice la página.

**Pestañas:**
| ID | Nombre FR | Contenido |
|---|---|---|
| `apercu` | Aperçu | Tarjeta hero con **mini-nebulosa**: un orbe WebGL pequeño que al pulsarlo abre el briefing en la consola de voz. También KPIs (llamadas respondidas, mensajes, citas, tiempo liberado como *estimación*), actividad reciente y la **gráfica apilada por canal** (tooltip y vista de tabla). |
| `appels` | Appels | Llamadas atendidas, con transcripción, resumen, etiqueta (caliente, normal) y botón « Écouter ». |
| `messages` | Messages | SMS, WhatsApp y DMs (estos dos últimos marcados por fases). |
| `email` | Courriel | Bandeja con borradores preparados por la asistente, que nunca envía sola. |
| `agenda` | Agenda | Calendario **mensual y semanal** (`#viewSeg`, `renderWeek()`, `shiftWeek`) con leyenda por tipo. |
| `briefings` | Briefings | Briefings de voz del día, con botón « Écouter ». |
| `reseaux` | Réseaux | Métricas de redes con **gráfica de línea con crosshair** (`lineChartHTML`/`wireLineChart`). |
| `contacts` | Contacts | Contactos con iniciales. |
| `assistant` | Assistante | Configuración de la asistente: persona, **Langues** (`renderLangs()`, máximo 5), **Intégrations** (`renderIntegrations()`), estado en vivo (`paintLivePill()`) y **chat** con la asistente. |

**Consola de voz** (se abre desde « Écouter » en briefings, llamadas y chat, y desde la mini-nebulosa):
- pantalla completa con nebulosa WebGL (`VC_FS`, `glNebula(cv)`);
- HUD en canvas 2D: anillo de barras radiales que se mueve con la voz, ticks, arcos y partículas (`hudState`, `hudDraw`);
- subtítulos palabra por palabra;
- usa la voz del navegador (`speechSynthesis`) si hay una; si no, avanza con tiempos simulados;
- controles para pausar, reanudar y terminar (`vcOpen(title, sub, lines)`, `vcPlayLine`, `vcPause`, `vcResume`, `vcStop`, `vcEnd`).

**Datos y variables:**
- `D`: los datos de ejemplo por idioma: `kpis`, `recent`, llamadas, mensajes, correos, agenda, briefings, redes, contactos;
- `U`: los textos de la interfaz;
- `PERSONAS`: `{sofia:{name:"Sofía",ini:"S",g:"f"}, alex:{…g:"n"}, tomas:{…g:"m"}}`;
- `ROLE`: palabras con concordancia de género;
- `LANGS`: los 18 idiomas ofrecidos en la pestaña Langues, con códigos (fr, en, es, it, pt, ar, he, hi, zh, vi, ht, tl, pa, fa, el, ru, pl, de);
- `INTEGRATIONS`, `LOGOS`, `CH` (canales) y `COLORS`;
- `COLORS` es la paleta de gráficas validada para lectura: claro `#2a78d6` / `#eb6834` / `#1baf7a`, oscuro `#3987e5` / `#d95926` / `#199e70`;
- estado: `uiLang`, `persona`, `client` (del parámetro `n`), `calView`, `calendarCursor`, `activeBrief`, `activeCall`, `activeEmail`, `activeMsg`, `showTable`.

**`/immobilier/demo/`** es el dashboard inmobiliario original (leads de compradores y vendedores, visitas), con la marca unificada. Tiene un enlace a `/demo/`.

---

## 5. Páginas por sector (generadas)

Las 8 páginas (`immobilier`, `cvc`, `paysagement`, `deneigement`, `garages`, `nettoyage`, `barbiers`, `dental`) **salen de una sola plantilla**. **No se editan a mano:** se cambia el contenido y se regeneran.

- **Plantilla y generador:** `tools/build_sectors.py`.
  - Toma de `index.html` el CSS, el orbe, los avatares, el tilt y el reveal, así que la home es la única fuente del estilo.
  - Escribe `<sector>/index.html` y además inyecta `HOME_SECTORS` en la home (menú, pestañas y banda).
- **Contenido:**
  - `tools/sectors_fr.py` (`FR`) es la fuente principal: textos más los campos numéricos, íconos, integraciones y persona por defecto;
  - `tools/sectors_en.py` y `tools/sectors_es.py` contienen solo textos traducidos;
  - `tools/generic_text.py` (`G`) contiene los textos comunes por idioma: navegación, teléfono, calculadora, planes, FAQ genérica, etiquetas.
- **Cada página tiene:**
  - hero con un guion de llamada propio del sector;
  - tarjetas flotantes;
  - dolor y solución, funciones;
  - **calculadora de ingresos perdidos**: fórmula `llamadas/semana × 4,33 × (% perdidas/100) × valor de un cliente`, con los campos `cr1`–`cr3`;
  - pasos, muestra del dashboard y logos de integraciones;
  - precios, FAQ (del sector más la genérica);
  - una **nota de límites**: OACIQ para inmobiliario, "no da consejo médico" para dental, seguridad del gas para CVC;
  - footer con enlaces a los demás sectores.
- **Persona por defecto:** `SEC.fr.persona` (`immobilier` usa `alex`; el resto, `sofia`).
- **Regenerar:** `SIMPLE_ICONS_DIR=<carpeta icons del paquete npm simple-icons> python3 tools/build_sectors.py`. La variable solo hace falta para añadir logos nuevos; los actuales ya están embebidos.

---

## 6. Onboarding de prospectos (`/onboarding/`)

Es el enlace que se manda a cualquier interesado. Todos los « Réserver ma démo » del sitio llevan aquí; desde una página de sector llevan con el sector ya puesto (`?secteur=cvc`).

**Qué pide y qué no.** No pide contraseñas, accesos ni pagos; lo dice en tres lugares. Solo sirve para construir una demo personalizada. Si el prospecto queda satisfecho, luego se firma el contrato y se transfiere su número o se le da uno nuevo.

**Los 7 pasos** (array `STEPS`; `*` = obligatorio):
1. **Bienvenue**: qué pasa después (demo, llamada de descubrimiento, número) y sin compromiso.
2. **Vous**: `firstName*`, `lastName*`, `email*` (validado), `phone*`, `role`, `prefLang`, `bestTime`.
3. **Votre entreprise**: `bizName*`, `sector*` (13 opciones, con `autre` más `sectorOther`), `website`, `city`, `team`, `hours`, `services*`, `avgValue`.
4. **Appels et messages**: `mainPhone`, `callsWeek`, `whoAnswers`, `channels`, `instagram`, `facebook`, `gbp` (ficha de Google), `calendar`, `software`.
5. **Votre adjointe**: `persona` (tarjetas con silueta), `langs` (máximo 5), `tone`, `greeting`, `urgent` y `urgentPhone`, `questions`, `faqs`, `never` (lo que nunca debe decir).
6. **Objectifs**: `goals`, `briefings`, `plan`, `startDate`, `source`, `notes`.
7. **Envoyer**: resumen de todas las respuestas más tres consentimientos:
   - `c1*`: uso para la demo, según la política de privacidad;
   - `c2*`: sin contraseñas y sin compromiso;
   - `c3`: marketing, opcional (CASL).

**Cómo se comporta:**
- guarda el borrador en `localStorage` (`aistaff-onboarding`);
- barra de progreso, validación por paso y selector FR/EN/ES.

**Envío de respuestas** (arriba del script):
```js
const ONBOARDING_WEBHOOK = "https://hook.us2.make.com/h45to1mdxrpdfnbeorgnntrr4t138a29";
const CONTACT_EMAIL = "hello@meetaistaff.com";
```
- **Estado actual (conectado):** el formulario hace POST al escenario de Make « AI Staff onboarding → Supabase leads », que guarda cada envío en la tabla `leads` de Supabase (2 operaciones por envío). Detalle en `docs/make-supabase.md`.
- **Respaldo:** si el POST falla, la pantalla final ofrece « Envoyer par courriel » (mailto prellenado a hello@), « Copier mes réponses » y « Télécharger (JSON) ».
- **Pendiente:** aviso por correo de cada lead (módulo Gmail en Make) y confirmación al prospecto con Resend.

---

## 7. Privacidad (`/confidentialite/`)

- Está en FR/EN/ES. Nombra a **Andrés Carreño** como responsable de la protección de datos personales (lo exige la Ley 25) y da el contacto hello@meetaistaff.com.
- **Contenido:**
  - datos recogidos: de prospectos, de clientes y de las personas que llaman a los clientes; AI Staff actúa como *prestataire de services*;
  - finalidades;
  - consentimiento y retiro;
  - IA y supervisión humana;
  - **tabla de subcontratistas** con su ubicación: Vapi, ElevenLabs, Soniox, OpenAI, Twilio, Anthropic, Make.com, Supabase, Resend, Google y GitHub Pages;
  - transferencias fuera de Quebec;
  - conservación: prospectos 12 meses; datos del servicio durante el contrato, más 30 días para exportarlos;
  - seguridad y registro de incidentes;
  - derechos, con respuesta en 30 días y recurso ante la CAI.
- **Cookies:** ninguna de seguimiento. Solo `localStorage` para el tema y el borrador del formulario.
- **Obligación práctica:** si se agrega un proveedor que recibe datos personales, hay que añadirlo a esta tabla.

---

## 8. Documentos legales (`docs/legal/`)

| Archivo | Contenido |
|---|---|
| `AI-Staff_Contrat-de-service_FR` (.docx y .pdf) | Contrato de servicio, 16 artículos más anexos (detalle abajo) |
| `AI-Staff_Service-Agreement_EN` | Versión en inglés. La francesa prevalece salvo que el cliente marque el artículo 16.6. |
| `AI-Staff_Entente-demo_FR` / `AI-Staff_Demo-Agreement_EN` | Acuerdo de demostración y confidencialidad (2 páginas): gratis, sin compromiso, sin contraseñas, destrucción a los 12 meses |
| `LEEME.md` | Guía legal en español con la lista de lo que hay que hacer (Ley 25, TPS/TVQ, seguro, firma electrónica) |

**Anexos del contrato:**
- A: bon de commande (plan, canales activos, opción de número);
- B: entente de traitement según la Ley 25;
- C: autorización de portabilidad del número.

**Puntos clave del contrato:**
- **Duración:** mes a mes, con 30 días de preaviso y sin penalidad.
- **Canales:** la nota de despliegue progresivo, y los canales nuevos se confirman por correo (art. 3.2).
- **Obligaciones del cliente:**
  - la IA se anuncia como IA y avisa de la grabación;
  - consentimientos CASL, CRTC y LNNTE a cargo del cliente;
  - sin consejo profesional (OACIQ, salud);
  - no es un servicio de emergencia (911).
- **Número de teléfono** (art. 5): transferido (sigue siendo del cliente), nuevo o desvío de llamadas.
- **Precio:** pago por adelantado, TPS 5 % y TVQ 9,975 % aparte.
- **Responsabilidad:** tope en lo pagado en los últimos 3 meses (salvo falta intencional o grave).
- **Ley aplicable:** leyes de Quebec y tribunales de Montreal. El francés va primero (Ley 96).

**Campos por completar antes de usar:** `[Nom légal]`, NEQ, dirección, números TPS/TVQ, tasa de interés por mora. **Recomendado:** que un abogado de Quebec los revise antes del primer cliente.

**Regenerar los documentos:** los textos están en `tools/legal/contrat_fr.js`, `contrat_en.js` y `demo.js`; `lib.js` es el constructor. Ejemplo: `node tools/legal/contrat_fr.js salida.docx` (necesita el paquete npm `docx`).

---

## 9. Marketing (`marketing/flyers/`)

| Archivo | Formato |
|---|---|
| `AI-Staff_flyer_FR` / `_EN` (.png 2448×3168 y .pdf) | Flyer general tamaño carta (Sofía), para imprimir |
| `AI-Staff_flyer-immobilier_FR` / `_EN` (.png y .pdf) | Flyer para courtiers tamaño carta (Alex, con la nota OACIQ) |
| `…_carre-1080.png` (4 archivos) | Versiones cuadradas para Instagram y Facebook |

- **Estilo:** fondo navy con orbe y anillo HUD, conversación de ejemplo (cliente, asistente y cita confirmada), funciones, precio « À partir de 997 $/mois », teléfono de la demo y **QR hacia `/onboarding/?ref=flyer`** (con `secteur=immobilier` en los inmobiliarios).
- **Fuentes y regeneración:** los HTML fuente están en `marketing/flyers/src/`; el generador es `tools/flyers/build.js` (Playwright y el paquete npm `qrcode`).
- **Guiones de video:** `docs/guiones-video.md` tiene 6 guiones por nicho, en FR y ES.

---

## 10. Proceso comercial y de onboarding (`docs/onboarding-playbook.md`)

1. **Interés:** respuesta en menos de 1 hora hábil con el link de onboarding (plantilla A).
2. **El prospecto llena `/onboarding/`** (unos 8 minutos).
3. **Construcción de la demo:**
   - se duplica el asistente de Vapi y se personaliza con su negocio;
   - se muestra el dashboard con `/demo/?n=Nombre&a=sofia`;
   - se hacen 3 llamadas de prueba;
   - se envía la plantilla C.
4. **Llamada de descubrimiento** (20–30 min): demo en vivo, canales activos y por fases, plan (se recomienda Exécutive), número. El Anexo A se llena durante la llamada.
5. **Contrato y primer pago:** se envía primero la versión en francés; firma electrónica; se crea el tenant en Supabase.
6. **Número:** se empieza con **desvío de llamadas** (el mismo día) mientras se procesa la **portabilidad**, que no tiene fecha garantizada. El NIP de portabilidad se pide solo por teléfono.
7. **Go-live por fases:**
   - fase 1: llamadas, SMS y agenda;
   - cada canal nuevo se confirma por correo (plantilla F);
   - los accesos se dan por OAuth, nunca por contraseña.
8. **Seguimiento:**
   - llamadas cortas el día 3 y el día 14;
   - resumen al día 30 y pedido de testimonio (con consentimiento escrito para usar el logo).

El playbook incluye 6 plantillas de correo y SMS en FR y EN.

---

## 11. Backend del briefing (diseño listo, sin implementar)

**Documentos:** `docs/briefing-backend.md` y `backend/supabase/001_briefings.sql`.

> El diseño se escribió para Retell; la voz ahora corre en **Vapi**. Equivalencias: `create-phone-call` → `POST /call` con `assistantId` y `assistantOverrides.variableValues`; webhook `call_ended` → mensaje `end-of-call-report` en el Server URL; inbound webhook → mensaje `assistant-request`; custom functions → *tools* de Vapi. Verificar en docs.vapi.ai antes de conectar.

- **Supabase:**
  - `owner_profiles`: teléfono del dueño, idioma, persona, horarios y `consent_at` (si está vacío, nunca se llama);
  - `briefings`: contexto, guion, transcripción y resumen;
  - `assistant_actions`;
  - la vista `due_briefings`;
  - todo con RLS.
- **Make, escenario A** (cada 15 min): lee `due_briefings`, luego Google Calendar, Gmail (no leídos importantes), llamadas de Retell y métricas de IG/FB (Meta Graph). Claude API redacta un guion de 90 segundos como máximo, se guarda en `briefings` y Retell llama al dueño (`create-phone-call` con variables dinámicas).
- **Escenario B:** webhook `call_ended` de Retell que guarda la transcripción y el resumen.
- **Escenario C:** llamada entrante. Si `from_number` es el del dueño, entra en "modo jefe" con los datos de su día; si no, recepción normal.
- **Escenario D:** funciones que Retell llama durante la conversación: `draft_email_reply` (solo borrador, nunca envía), `move_appointment` y `get_agenda`. Todo se registra en `assistant_actions`.
- **Agente de Retell "Briefing":** el prompt está en el documento. Usa la misma voz, tutea y no inventa datos.

---

## 12. Publicación (deploy)

**Estado actual:**
- todo el trabajo está en la rama `claude/new-session-tnxmad`;
- hay un Pull Request abierto hacia `main`: https://github.com/Andresfcarreno/aistaff-website/pull/1;
- `meetaistaff.com` **todavía apunta a Netlify** (A `75.2.60.5`), así que el sitio nuevo aún no es público.

**Para publicar** (detalle en `docs/DEPLOY.md`):
1. Hacer merge del PR a `main`.
2. En GitHub, ir a Settings → Pages, elegir *Deploy from a branch*, `main`, carpeta `/ (root)`, con dominio personalizado `meetaistaff.com` (el archivo `CNAME` ya existe).
3. En el DNS de Ionos:
   - **borrar** el registro A `@` `75.2.60.5` (y cualquier AAAA de `@`, más el `www` viejo);
   - **agregar** los registros A `@` `185.199.108.153`, `185.199.109.153`, `185.199.110.153` y `185.199.111.153`;
   - **agregar** los AAAA `@` `2606:50c0:8000::153`, `8001::153`, `8002::153` y `8003::153`;
   - **agregar** el CNAME `www` → `andresfcarreno.github.io`;
   - **no tocar** los registros MX ni TXT del correo.
4. Activar **Enforce HTTPS** cuando GitHub termine de verificar el DNS.

Desde entonces, cada merge a `main` publica el sitio automáticamente.

---

## 13. Pendientes

1. **Publicar el sitio:** merge del PR, activar Pages y cambiar el DNS (sección 12).
2. **Onboarding:** el webhook ya guarda en Supabase (`leads`). Falta el aviso por correo de cada lead (módulo Gmail en Make, ver `docs/make-supabase.md`) y la confirmación al prospecto.
3. **Asistente de la línea demo en Vapi:** hoy se presenta como « Alex » de « MeetAIstaff » y cotiza precios viejos. El prompt corregido (« Sofía, l'adjointe IA d'AI Staff ») está listo en `docs/vapi-asistente-sofia.md` para pegarlo en el panel de Vapi.
4. **Contratos:** completar NEQ, dirección, TPS/TVQ e interés por mora, y hacerlos revisar por un abogado de Quebec.
5. **Obligaciones de la Ley 25** (lista en `docs/legal/LEEME.md`):
   - evaluación de factores de privacidad para los proveedores fuera de Quebec;
   - aceptar el DPA de cada proveedor;
   - registro de incidentes;
   - Supabase en la región `ca-central-1` si es posible.
6. **Backend del briefing:** implementar la sección 11 en Supabase, Make y Vapi (necesita un plan de pago de Make y la tabla `clients`). Primero para el propio Andrés, como prueba interna.
7. **Verificar los idiomas de Vapi:** el sitio ofrece "20+ langues" en el plan Dédiée. Hay que confirmar qué idiomas soporta de verdad la configuración de Vapi (hoy el transcriptor está solo en FR/EN/ES) y ajustar el texto si hace falta.
8. **`presentation.html`:** eliminada (era una página vieja no enlazada).
9. **Videos** por nicho a partir de `docs/guiones-video.md`.

---

## 14. Cómo trabajar en el proyecto

- **Cambiar un texto de la home:** editar la clave en `STR` (o en `EXTRA`), en los **tres** idiomas. Después correr `python3 tools/build_sectors.py`, porque las páginas de sector copian estilos de la home.
- **Cambiar un texto de un sector:** editar `tools/sectors_fr.py`, `sectors_en.py` y `sectors_es.py` (o `generic_text.py` si es común), y regenerar.
- **Cambiar precios:**
  - en la home (`STR`, planes);
  - en `tools/generic_text.py` (páginas de sector), y regenerar;
  - en el Anexo A de los contratos (`tools/legal/`);
  - en los flyers (`tools/flyers/build.js`);
  - en la política de precios del playbook.
- **Probar localmente:**
  - `python3 -m http.server 8765` en la raíz del proyecto y abrir `http://localhost:8765/`;
  - revisar móvil y escritorio, claro y oscuro, FR/EN/ES;
  - que no haya scroll horizontal ni errores en la consola.
- **Estilo del copy en francés:**
  - espacio antes de `:` en francés (« Déploiement progressif : … »);
  - montos como `1 497 $`;
  - horas como `14 h 30`;
  - formas neutras con punto medio (`adjoint·e`) para Alex.
- **Tono:** directo, cálido, concreto. Nada de estadísticas inventadas ni de promesas de fechas.

---

## 15. Índice de archivos del paquete

```
index.html                     Home v2
demo/index.html                Dashboard de demo general
immobilier/index.html          Landing courtiers (generada)
immobilier/demo/index.html     Dashboard inmobiliario
cvc/ paysagement/ deneigement/ garages/ nettoyage/ barbiers/ dental/   Landings por sector (generadas)
onboarding/index.html          Formulario de prospectos
confidentialite/index.html     Política de privacidad
404.html CNAME .nojekyll robots.txt sitemap.xml   Configuración de hosting
CLAUDE.md                      Contexto breve para asistentes de código
docs/PROYECTO-COMPLETO.md      Este documento
docs/DEPLOY.md                 Publicación y DNS
docs/briefing-backend.md       Diseño del backend del briefing
docs/guiones-video.md          Guiones de video por nicho
docs/onboarding-playbook.md    Proceso comercial y plantillas
docs/legal/                    Contratos, entente de démo y guía legal
docs/make-supabase.md          Estado real de Make y Supabase (IDs, escenarios, trampas)
docs/vapi-asistente-sofia.md   Prompt y configuración del asistente de Vapi
backend/supabase/000_calls_bookings.sql   Tablas calls y bookings (aplicado)
backend/supabase/001_briefings.sql   Esquema SQL de briefings (sin aplicar)
backend/supabase/002_leads.sql       Tabla leads del onboarding (aplicado)
marketing/flyers/              Flyers PNG/PDF y sus fuentes HTML
tools/build_sectors.py         Generador de páginas de sector
tools/sectors_fr.py sectors_en.py sectors_es.py generic_text.py   Contenido de sectores
tools/legal/                   Generador de contratos (.docx)
tools/flyers/build.js          Generador de flyers
```
