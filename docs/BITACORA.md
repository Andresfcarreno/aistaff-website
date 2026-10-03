# Bitácora de trabajo: qué se hizo y en qué estado quedó

> Para Cowork y para cualquier sesión que continúe el proyecto. Lee primero `CLAUDE.md` (reglas) y `docs/PROYECTO-COMPLETO.md` (visión general). Este archivo cuenta **lo hecho entre el 26 de septiembre y el 3 de octubre de 2026**, las decisiones del dueño, el estado de las cuentas y lo que quedó pendiente.
> No contiene claves ni contraseñas, y no deben agregarse aquí.

## 1. Decisiones del dueño (Andrés Carreño) que mandan
1. **Precios** (CAD, **más impuestos**, mes a mes, sin contrato, instalación gratis en el lanzamiento):
   - Essentiel / Essential / Esencial: **397 $**
   - Pro: **597 $**
   - Complet / Complete / Completo: **797 $**
2. **Qué incluye cada plan**
   - **Essentiel:** número dedicado, llamadas 24/7 (FR/EN/ES), SMS, citas en la agenda, dashboard privado y poder llamar a Sofía para pedirle reportes. El dueño la llama; ella no lo llama.
   - **Pro:** todo lo anterior, más WhatsApp, llamadas programadas de Sofía al dueño (hasta 3 por día) y llamadas ilimitadas con uso razonable.
   - **Complet:** todo lo anterior, más Instagram, Facebook y métricas de redes, con acceso prioritario.
3. Los tres planes tienen **el mismo peso visual** (ninguno "destacado").
4. **No se menciona a ningún humano** de respaldo. Solo "acceso prioritario: tus preguntas y cambios van primero".
5. **El correo no está en los planes** (no complicar).
6. Se vende **"+ taxes"** (TPS 5 % y TVQ 9,975 %). Para facturar con impuestos hay que registrarse; el contador debe confirmarlo.
7. **Honestidad:** WhatsApp, llamadas programadas, Instagram/Facebook, estadísticas y reportes por llamada se marcan **"par phases"** hasta que existan. Nunca prometer plazos.
8. La página debe ser **simple y limpia**, pero **igual de atractiva que las páginas de sector** (celular flotante, dashboard de muestra, calculadora, integraciones): la home debe verse como ellas, en versión general.

## 2. Línea de tiempo de lo hecho
| Fecha | Qué |
|---|---|
| 26–27 sept. | Home trilingüe, dashboard `/demo/`, landing inmobiliaria, despliegue en GitHub Pages, diseño del briefing, guiones de video. |
| 27 sept. | Home v2 (orbe WebGL), gráficas y calendario, consola de voz, 8 páginas de sector generadas, nebulosa en el Aperçu. |
| 27 sept. | `/onboarding/` (formulario de 7 pasos FR/EN/ES), `/confidentialite/` (Ley 25), contratos y legal (`docs/legal/`), playbook de onboarding, flyers FR/EN. |
| 28 sept. | Paquete ZIP y guía `PROYECTO-COMPLETO` para otra sesión de trabajo. |
| 1–2 oct. | **Otra sesión** (en paralelo) construyó el dashboard real con Supabase, la voz propia de Sofía, la guía de despliegue y separó el proyecto IO. |
| 2 oct. | Diseño de la línea demo que se adapta al negocio de quien llama. Nuevos precios y home simple. Se conectó el formulario a Make. |
| 3 oct. | Revisión de Supabase y Make; corrección de escenarios; unión con `main` y merge del PR #1; recálculo de costos. |

## 3. Cambios del 2–3 de octubre (esta sesión)
### 3.1 Sitio
- **Página principal** (`index.html`, **generada**): el 2 de octubre se hizo una home mínima aparte, pero al dueño le gustaron más las páginas de sector. **El 3 de octubre la home pasó a ser el sector "general"** de `tools/build_sectors.py`: mismo diseño que los sectores (celular flotante, dashboard de muestra, integraciones), con una calculadora que compara un empleado real con AI Staff. Contenido en `tools/general_content.py`.
  - `tools/home_source.html` (home v2 anterior) se conserva **solo porque el generador toma de ahí el CSS y los efectos**.
  - **Dashboard de muestra con pestañas** (3 oct.): en todas las páginas generadas, 6 pestañas intercambiables (Aperçu, Appels, Messages, Agenda, Réseaux, Contacts) derivadas de los datos de cada sector; rótulos en `tools/dash_text.py`. Las citas de la agenda caen en el día que dice su texto.
  - Se eliminaron `tools/build_home.py`, `home_template.html`, `plans.json` y `sectors_menu.json`.
- Las 8 páginas de sector se regeneraron con los planes nuevos (`python3 tools/build_sectors.py`; `generic_text.py` y `sectors_*.py` ya no mencionan "Exécutive", "Dédiée" ni a un equipo humano).
- Se corrigió un desborde horizontal en las páginas de sector entre 1100 y 1250 px (`html{overflow-x:clip}` en la plantilla).
- `/onboarding/`: lista de planes actualizada. Su webhook de Make ya estaba conectado en `main`.
- `docs/DEPLOY.md`: tabla de parámetros de URL actualizada (la home ya no usa `niche` ni `n`).

### 3.2 Contratos, flyers y documentos
- Anexo A del contrato (FR/EN) con los 3 planes; se quitó la fila de correo de la tabla de canales. Se regeneraron `.docx` y `.pdf` con `tools/legal/*.js` (las 2 frases de `main` que quitan a Retell de los subcontratistas se conservaron).
- Flyers con "À partir de 397 $" y la nota "par phases: WhatsApp, Instagram, Facebook et appels programmés" (`tools/flyers/build.js`).
- Nuevos: `docs/precios-y-costos.md` (costos reales y márgenes), `docs/demo-agent-retell.md` (diseño de la línea demo adaptable), `backend/supabase/002_demo_calls.sql` (tabla `demo_calls`, **no aplicada** en Supabase), `docs/BITACORA.md` (este archivo).
- Guiones de video, playbook y guía `PROYECTO-COMPLETO` (md y pdf) con los precios nuevos.

### 3.3 Unión con `main`
- `main` y la rama habían divergido (55 conflictos). En lugar de resolverlos a ciegas, se partió de `main` y se volvieron a aplicar los 3 cambios nuevos. En `CLAUDE.md`, `onboarding/` y `confidentialite/` se **conservó la versión de `main`**.
- PR #1 combinado en `main` (commit `a790d2a`). GitHub Pages desplegó automáticamente.

## 4. Estado de las cuentas (sin claves)
### Supabase, proyecto **MEETAISTAFF BUSINESS** (`vqvdmcxkkmkyxpfnxmzo`, región us-east-2)
- Hay otro proyecto, **"IO"** (`yoadlzogdoqtkjyiyocp`), que **no pertenece a AI Staff: no tocarlo.**
- Tablas: `calls`, `bookings`, `leads`, `voice_sessions`, `tenants`, `messages`, `emails`, `events`, `social_items`. RLS activo en todas.
  - El acceso está limitado por correo del dueño o del negocio (`tenants.owner_email`).
  - `leads` y `voice_sessions` no tienen políticas: solo el *service role* (Make y la voz) puede escribir.
- Triggers: `leads_fill` reparte el JSON de `payload` en las columnas de `leads` (mismos nombres de campo que envía `/onboarding/`).
- **Avisos del linter** (no corregidos): la función `leads_fill_from_payload` tiene `search_path` mutable (WARN) y la protección contra contraseñas filtradas está desactivada.
- **Fila de prueba pendiente de borrar** en `leads`: `biz_name = 'TEST-BORRAR'`, `email = prueba-borrar@example.invalid`. El borrado se canceló tres veces desde la sesión. Borrar con: `delete from leads where biz_name = 'TEST-BORRAR';`

### Make (zona us2, equipo "My Team", id 3067204)
| Escenario | ID | Estado |
|---|---|---|
| AI Staff onboarding → Supabase leads | 6451758 | **Activo.** Webhook de Make → filtra por consentimiento y correo válido → `leads`. |
| AI Staff Calendar → dashboard (events) | 6480048 | **Activo** desde el 3 oct. Corre cada 15 min y guarda eventos en `events` (corregido para usar columnas reales). |
| AI Staff Gmail → dashboard (emails) | 6480047 | **Apagado.** Corregido el mapeo, pero **el plan de Make permite solo 2 escenarios activos**. Como el correo no está en los planes, se dejó apagado. |

- Las conexiones (Gmail, Google Calendar, Supabase, Anthropic) están creadas y vigentes.
- El módulo `supabase:createARow` escribe **cada columna por separado**. Los escenarios fallaban porque mandaban todo en una columna `payload` que `emails` y `events` no tienen; la corrección fue cambiar el mapeo en Make, sin tocar la base de datos.
- Dato técnico: desde las sesiones de código no se pueden enviar POST directos a Make (el proxy bloquea). `scenarios_run` no entrega el cuerpo de un webhook.

### GitHub
- Repositorio `Andresfcarreno/aistaff-website`. `main` se publica solo en GitHub Pages. La rama de trabajo de estas sesiones es `claude/new-session-tnxmad` y el trabajo posterior al PR #1 se hace ahí.

## 5. Lo que se intentó y no se pudo
- **Migración de Supabase** (agregar `payload` y triggers a `emails` y `events`, fijar el `search_path` de `leads`): cancelada dos veces. Quedó **sin aplicar**; no hacía falta tras corregir los escenarios en Make.
- **Borrado de la fila de prueba:** cancelado tres veces.
- **Activar Gmail:** límite del plan de Make.
- **Prueba de punta a punta del formulario con el sitio real:** no se pudo desde las sesiones. Se verificó por partes: la página envía el cuerpo correcto, pasa los filtros del escenario, y el trigger de `leads` reparte los campos bien.
  - **Falta:** que Andrés llene el formulario ya publicado y confirme que aparece la fila en `leads`.

## 6. Cosas que hay que saber antes de tocar algo
1. **La línea demo usa las dos piezas de voz, en cadena** (confirmado el 3 oct. con las llamadas guardadas en Supabase):
   - Twilio llama a la función `voice` de Supabase, que pasa la llamada al Worker `voice-relay` de Cloudflare (ConversationRelay, Deepgram, ElevenLabs, Claude Haiku 4.5). Lo que se oye es el prompt de `voice-relay/src/prompt.ts`.
   - Si el relay falla, `voice` sigue sola por turnos (`<Gather>`, voces Google Chirp3-HD) con su propia copia del prompt. **Las dos copias deben ser iguales** (la de `voice` lleva además las etiquetas `[[LANG:xx]]`).
   - El Worker se publica solo con cada merge a `main`. El check rojo "Workers Builds" en las ramas es una compilación de vista previa de Cloudflare, no afecta.
2. **Ya no se usa Retell ni Vapi.** Los documentos `docs/demo-agent-retell.md`, `docs/briefing-backend.md` y parte de `PROYECTO-COMPLETO` fueron escritos pensando en Retell: la lógica sirve, los nombres de herramientas no.
3. **No editar a mano** `index.html` ni las páginas de sector: son generadas (ver 3.1). Si se cambia un precio o un texto, regenerar y volver a probar.
4. **Los precios viven en varios lugares:** `tools/generic_text.py`, `tools/legal/contrat_*.js` (Anexo A), `tools/flyers/build.js`, `onboarding/index.html` (lista de planes), playbook, guiones de video, `CLAUDE.md` y `PROYECTO-COMPLETO`. Cambiar uno exige revisar los demás: `grep -rn "397\|597\|797"`.
5. **Nunca claves en el repositorio.** El webhook de Make en `onboarding/` es una URL pública por diseño; el escenario descarta lo que no traiga consentimiento y un correo válido.
6. Cualquier cambio en la base de datos o en Make de AI Staff requiere confirmación del dueño: ya canceló varias operaciones de escritura.

## 7. Costos y márgenes (resumen; detalle en `docs/precios-y-costos.md`)
- Costo por minuto de llamada con la voz B: ≈ 0,09 a 0,11 $ (Twilio ConversationRelay 0,07 $ + línea entrante de Canadá 0,0085 $ + Claude Haiku 4.5, estimado por el código).
- Costo mensual por cliente: Essentiel 35–45 $, Pro 66–140 $, Complet 105–180 $, siempre bajo el 25 % del precio. Los precios se sostienen.
- **Sin verificar:** si los 0,07 $ de Twilio incluyen ElevenLabs y Deepgram; el precio de llamadas salientes; los costos fijos de Supabase y Make para clientes que pagan. Medir tras una semana de llamadas reales.

## 8. Pendientes, en orden sugerido
1. **Andrés:** llenar el formulario publicado y confirmar que llega a `leads`; borrar la fila de prueba.
2. ~~Confirmar a qué voz apunta Twilio~~: hecho (ver 6.1). **Andrés:** poner las claves del aviso de leads (sección 9).
3. Construir lo prometido en cada plan antes de venderlo como activo:
   - dashboard con datos reales por cliente (ya hay avances en `demo/` y las tablas);
   - que Sofía reconozca al dueño cuando llama y le dé sus reportes;
   - llamadas programadas y WhatsApp por Twilio;
   - Instagram y Facebook por ManyChat (≈ 39 $/mes por cliente) y métricas de redes.
4. Completar NEQ, dirección, TPS/TVQ e interés por mora en los contratos (`tools/legal/`) y que los revise un abogado de Quebec. Registrarse para TPS/TVQ para poder facturar.
5. Evaluación de privacidad y acuerdos de procesamiento con cada proveedor (lista en `docs/legal/LEEME.md`).
6. ~~Aviso de cada lead nuevo~~: construido (sección 9); falta la clave de Resend o de Twilio.
7. Decidir si se sube el plan de Make (más escenarios activos) y pasar Supabase al plan de pago antes de tener clientes.
8. Revisar los avisos de seguridad de Supabase (sección 4).
9. Línea demo que se adapta al negocio de quien llama (`docs/demo-agent-retell.md`, adaptada a la voz propia) y bloque "Llama y dile qué negocio tienes" en la home.
10. Videos por nicho (`docs/guiones-video.md`).

## 9. 3 de octubre (tarde): "poner todo a funcionar"
**Hecho y verificado:**
- **Precios de Sofía corregidos.** La línea demo todavía decía 997/1 497/2 497 $ y "la más popular". Ahora cita 397/597/797 $ + impuestos, los tres planes iguales, con "par phases" donde corresponde y la asistente humana como estimación. Cambiado en `voice-relay/src/prompt.ts` (se publica con el merge a `main`) y en `supabase/functions/voice/index.ts` (desplegada, versión 8).
- **El respaldo `voice` tiene el mismo prompt que el relay** (pitch para dueños latinos, role-play del negocio de quien llama, reglas para dictar el correo).
- **Las llamadas interesadas se vuelven leads.** Al analizar cada llamada, Claude extrae también negocio, sector, correo (solo si se confirmó) y cuándo llamar. Si la persona está calificada o dio un correo, se crea una fila en `leads` con `ref = appel-demo` y `payload.source = "call"`. Así el formulario y las llamadas caen en la misma bandeja.
- **Aviso de cada lead nuevo:** función `lead-notify` (desplegada) + cron `lead-notify` en Supabase (cada minuto, solo llama si hay leads sin avisar desde el 3 oct.). Envía un correo por Resend y/o un SMS por Twilio, y marca el lead con `payload.notified_at`. Si ningún canal funciona, reintenta (hasta 7 días).
  - Probado: con la clave correcta responde 200, sin ella 403.
- Secreto nuevo en el Vault: `NOTIFY_KEY` (lo comparten el cron y la función).
- `supabase/functions/messages-in/` agregado al repo (ya estaba desplegado, faltaba el código).

**Falta (Andrés, 5 minutos, en Supabase → Edge Functions → Secrets):**
- Correo: `RESEND_API_KEY` (resend.com → API Keys; el dominio meetaistaff.com ya tiene los registros de Resend). Opcional `NOTIFY_EMAIL` (por defecto hello@meetaistaff.com).
- SMS: `TWILIO_ACCOUNT_SID` (consola de Twilio, empieza por AC…) y `NOTIFY_PHONE` (tu celular, formato +1…). `TWILIO_AUTH_TOKEN` ya existe.
- Mientras no exista ninguno, los leads se guardan igual y el aviso sale en cuanto se agregue la clave.

**No se pudo desde la sesión:** cambios de esquema en Supabase (`apply_migration` y DDL se quedan esperando y vencen a los 60 s). Por eso el aviso usa un cron y no un trigger. Queda pendiente correr en el SQL Editor: `alter function public.leads_fill_from_payload() set search_path = '';` (aviso del linter).
