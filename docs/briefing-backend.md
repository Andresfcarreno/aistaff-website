# Backend del briefing por llamada (Tarea 5)

> **Objetivo del dogfooding:** que Andrés reciba su propio briefing a las 7:30 y pueda llamar a Sofía desde su celular. Ella lo reconoce por su número y le da su día.
> **Regla de oro:** ninguna clave API va en el HTML. Todo pasa por Make (o por una función serverless) y Supabase usa RLS.

## Arquitectura

```
                ┌──────────── Make: Escenario A (cada 15 min) ─────────────┐
Supabase        │ 1. Leer vista due_briefings                              │
due_briefings ─►│ 2. Google Calendar → citas del día                       │
                │ 3. Gmail → no leídos importantes (24 h)                  │
                │ 4. Supabase → llamadas que atendió Retell (desde ayer)   │
                │ 5. Meta Graph API → métricas del último post IG/FB       │
                │ 6. Claude API → redacta el briefing (≤ 90 s hablado)     │
                │ 7. Supabase → insert briefings (status=calling)          │
                │ 8. Retell → create-phone-call al dueño con variables     │
                └──────────────────────────────────────────────────────────┘
Retell ──(webhook call_ended)──► Make: Escenario B → guarda transcripción + resumen

Dueño llama al +1 438… ──► Retell (inbound webhook) ──► Make: Escenario C
      ├─ si from_number = owner_phone → devuelve variables de su día (modo "jefe")
      └─ si no → agente normal de recepción

Durante la llamada, Retell (custom functions) ──► Make: Escenario D
      ├─ draft_email_reply  → Gmail: crear borrador (nunca enviar)
      ├─ move_appointment   → Google Calendar: mover evento
      └─ get_agenda(date)   → Google Calendar: leer día
      y registra todo en assistant_actions
```

## 1. Supabase

Ejecuta [`backend/supabase/001_briefings.sql`](../backend/supabase/001_briefings.sql) en el SQL Editor. El script crea:
- `owner_profiles`: teléfono del dueño, idioma, persona, horarios y **fecha de consentimiento**. Si esa fecha está vacía, nunca se le llama.
- `briefings`: una fila por llamada, con contexto, guion, transcripción y resumen.
- `assistant_actions`: lo que el dueño pidió por teléfono.
- La vista `due_briefings`: los briefings que tocan en los próximos 15 minutos, sin duplicados.

> Si tu tabla de clientes no se llama `clients`, cambia la referencia en el SQL antes de ejecutarlo.

Tu fila de dogfooding sería así:

```sql
insert into owner_profiles (client_id, owner_name, owner_phone, lang, persona, consent_at)
values ('<tu client_id>', 'Andrés', '+1XXXXXXXXXX', 'es', 'sofia', now());
```

## 2. Make: Escenario A (preparar y lanzar el briefing)

**Trigger:** *Schedule* cada 15 minutos.

| # | Módulo | Configuración |
|---|---|---|
| 1 | Supabase → Search rows | Tabla/vista `due_briefings` (sin filtro). Después pon un *Iterator*. |
| 2 | Google Calendar → Search events | Calendar = `google_calendar_id`; desde hoy 00:00 hasta 23:59 en la zona `timezone` |
| 3 | Gmail → Search emails | Consulta `is:unread is:important newer_than:1d`, máximo 10. Solo asunto, remitente y extracto. |
| 4 | Supabase → Search rows | Tus llamadas de Retell de las últimas 24 h (tabla actual de llamadas) |
| 5 | HTTP → Make a request (opcional) | `GET https://graph.facebook.com/v21.0/{instagram_user_id}/media?fields=id,caption,timestamp,like_count,comments_count&limit=1`, luego `/{media_id}/insights?metric=views,reach,saved,shares` con el token de página guardado en una *Connection* de Make |
| 6 | HTTP → Claude API | Ver abajo |
| 7 | Supabase → Create row | `briefings` con `status='calling'`, `context` (JSON de los pasos 2–5) y `script` (texto del paso 6) |
| 8 | HTTP → Retell | Ver abajo. Guarda `call_id` en `briefings.retell_call_id` con *Update row*. |

> Revisa en la documentación de Meta la versión actual de la Graph API y los nombres de las métricas antes de conectarlo: cambian seguido.

### Paso 6: llamada a Claude

- `POST https://api.anthropic.com/v1/messages`
- Headers: `x-api-key: {{clave en Make}}`, `anthropic-version: 2023-06-01`, `content-type: application/json`

```json
{
  "model": "claude-sonnet-5",
  "max_tokens": 700,
  "system": "Eres {{persona}}, asistente personal de {{owner_name}}. Redacta el guion de un briefing telefónico en {{lang}} (fr/en/es), tuteando, cálido y directo. Máximo 90 segundos hablado (~180 palabras). Orden: 1) agenda del día (número de citas, la primera con hora), 2) llamadas atendidas y cuáles son calientes, 3) correos urgentes (remitente + en 5 palabras qué quieren), 4) métrica del último post si hay datos. Termina preguntando si quiere que respondas o muevas algo, y di a qué hora vuelves a llamar. No inventes nada que no esté en los datos. Si un bloque está vacío, sáltalo. Números y horas en formato natural para voz. Devuelve SOLO el guion.",
  "messages": [
    { "role": "user", "content": "Tipo: {{kind}}. Próxima llamada: {{next_slot}}.\nDATOS:\n{{json de los pasos 2-5}}" }
  ]
}
```

El guion sale de `content[0].text`.

### Paso 8: llamada saliente con Retell

- `POST https://api.retellai.com/v2/create-phone-call`
- Header: `Authorization: Bearer {{RETELL_API_KEY}}`

```json
{
  "from_number": "+14388058804",
  "to_number": "{{owner_phone}}",
  "override_agent_id": "{{AGENT_ID_BRIEFING}}",
  "retell_llm_dynamic_variables": {
    "owner_name": "{{owner_name}}",
    "persona": "{{persona}}",
    "lang": "{{lang}}",
    "briefing_script": "{{script}}",
    "agenda_json": "{{citas del día en JSON corto}}",
    "emails_json": "{{correos en JSON corto}}",
    "next_call": "{{hora de la próxima llamada}}"
  },
  "metadata": { "briefing_id": "{{id de la fila}}", "client_id": "{{client_id}}" }
}
```

> Confirma los nombres exactos de los campos en docs.retellai.com (API "Create Phone Call") antes de conectarlo.

## 3. Agente de Retell "Briefing" (prompt)

Crea un agente aparte, con la misma voz que el de recepción, y úsalo con `override_agent_id`.

```
Eres {{persona}}, la asistente personal de {{owner_name}} en AI Staff. Estás LLAMANDO tú a {{owner_name}} para su briefing.
Idioma: {{lang}}. Tutea. Sé breve y natural, como una asistente de confianza.

1. Saluda y di el briefing basándote en este guion (puedes decirlo con tus palabras, sin inventar datos):
{{briefing_script}}
2. Pregunta si quiere que hagas algo.
3. Si pide responder un correo → usa draft_email_reply. Crea SOLO un borrador; di "te dejo el borrador listo para aprobar".
   Si pide mover una cita → usa move_appointment y confirma la nueva hora.
   Si pregunta por otro día → usa get_agenda.
4. Si pide algo fuera de esto: "Lo anoto y el equipo lo revisa", y usa note.
5. Cierra: "Te llamo a las {{next_call}}." Máximo 3 minutos de llamada.
Nunca envíes correos, nunca des consejos legales, médicos, financieros ni de corretaje.
```

**Custom functions** (en Retell, tipo "custom function" apuntando a un webhook de Make):

| Nombre | Parámetros | Qué hace Make (Escenario D) |
|---|---|---|
| `draft_email_reply` | `to_name`, `intent` | Busca el último correo de `to_name` en Gmail, redacta con Claude y crea el **borrador** con *Gmail → Create a draft*. Inserta en `assistant_actions`. Responde `{"ok":true}` |
| `move_appointment` | `who`, `from_time`, `to_time` | Busca el evento, lo mueve y avisa al cliente por SMS (Twilio) solo si el plan lo incluye. Inserta la acción. |
| `get_agenda` | `date` | Devuelve la lista de eventos de ese día en texto corto |
| `note` | `text` | Inserta en `assistant_actions` con `type=note` y `status=needs_human`. Te manda email por Resend. |

## 4. Make: Escenario B (fin de llamada)

1. En Retell → Webhooks, pon la URL de un *Custom webhook* de Make.
2. Filtra `event = call_ended` o `call_analyzed`, y que `metadata.briefing_id` exista.
3. Haz *Update row* en `briefings`:
   - `status`: `completed`, o `no_answer` si `disconnection_reason` indica que no contestó;
   - `duration_sec`;
   - `transcript` (el `transcript_object` de Retell);
   - `summary` (el `call_analysis.call_summary`).
4. Si no contestó, puedes mandar un SMS: "Tu briefing está en el dashboard".

## 5. Make: Escenario C (el dueño llama y ella lo reconoce)

1. En Retell → Phone Numbers → +1 438-805-8804, configura el **inbound webhook** con la URL de Make.
2. Make recibe `from_number` y busca en `owner_profiles.owner_phone`.
   - **Si coincide:** junta la agenda de hoy y de mañana y los correos pendientes (igual que los pasos 2–4 del Escenario A) y responde con `override_agent_id = AGENT_ID_BRIEFING` y las variables dinámicas. En este caso, `briefing_script` es un resumen corto y el prompt empieza con "Él te está llamando a ti".
   - **Si no coincide:** responde vacío y contesta el agente normal de recepción/demo.

> El formato exacto de la respuesta del inbound webhook está en la documentación de Retell ("Inbound call webhook"). Verifícalo antes de conectarlo.

## 6. Dashboard (pestaña Briefings)

La pestaña **Briefings** de `/demo/` ya muestra la forma final: horarios, historial y transcripción de cada briefing. Para conectarla con datos reales:
- Un endpoint (webhook de Make o función serverless) recibe `dashboard_token`, valida el cliente y devuelve `briefings` y `owner_profiles.briefing_slots` en JSON.
- El HTML hace `fetch` a ese endpoint. **Nunca** llama a Supabase directamente con una clave.
- Los interruptores de horario hacen `POST` al mismo endpoint, que actualiza `briefing_slots`.

## 7. Seguridad y cumplimiento

- **Claves** (Claude, Retell, Supabase service_role, Meta, Google): solo en *Connections* o variables de Make. Nunca en HTML ni en el repo.
- **Webhooks de Make:** agrega un header secreto (`x-aistaff-secret`) y valida la firma de Retell (`x-retell-signature`) cuando esté disponible.
- **Llamadas salientes:** solo a `owner_profiles` con `consent_at` definido. Nada de llamadas en frío a prospectos.
- **Correo:** solo borradores. Nada se envía sin aprobación.
- **Ley 25:** guarda solo lo necesario. Considera borrar transcripciones después de X días, según lo acordado con cada cliente.

## 8. Checklist de dogfooding (orden sugerido)

1. [ ] Ejecutar el SQL e insertar tu `owner_profiles` con `consent_at = now()`.
2. [ ] Crear el agente "Briefing" en Retell con el prompt de arriba (voz Sofía, ES).
3. [ ] Escenario A **sin** Retell: que solo guarde `script` en Supabase. Revisa 2–3 guiones.
4. [ ] Activar el paso 8 (llamada) con un solo slot a las 7:30.
5. [ ] Escenario B: transcripción guardada.
6. [ ] Escenario C: llamarte desde tu celular y preguntar "¿qué tengo mañana?".
7. [ ] Escenario D: `draft_email_reply` → confirmar que aparece el borrador en Gmail.
8. [ ] Usarlo 1 semana y grabar un video real para el primer anuncio.
