# Voz propia de la línea demo (sin Vapi)

Desde el 30 sept. 2026, la línea demo +1 (438) 805-8804 funciona con una voz propia de AI Staff:

```
Llamada ─► Twilio ─► Edge Function `voice` (Supabase) ─► Claude (Anthropic)
             ▲              │  guarda cada turno en voice_sessions
             └── TwiML ◄────┘  (<Say> voz Polly + <Gather> reconocimiento de voz)

Al colgar ─► pg_cron (cada minuto) ─► `voice?step=sweep` ─► análisis con Claude ─► tabla `calls`
```

- **Código:** `supabase/functions/voice/index.ts` (desplegado en el proyecto `vqvdmcxkkmkyxpfnxmzo`).
- **SQL:** `backend/supabase/003_voice.sql` (tabla `voice_sessions`, lectura de secretos desde Vault, cron `voice-sweep`).
- **Por qué `<Gather>` por turnos y no streaming:** en el plan Free, cada Edge Function vive como máximo 150 s. Una conexión WebSocket cortaría las llamadas largas. Con `<Gather>`, cada turno es una petición corta y la llamada puede durar lo que haga falta (tope de seguridad: 15 min o 40 turnos).
- **Idiomas:** empieza en francés (Quebec). La persona puede marcar **2** para inglés o **3** para español, o simplemente hablar en su idioma: Claude cambia de idioma y la voz y el reconocimiento se ajustan en el turno siguiente.
- **Voces:** Amazon Polly neuronal vía Twilio: Gabrielle (fr-CA), Joanna (en-US), Lupe (es-US).
- **Modelo:** `claude-opus-5-5` con `effort: low` (respuestas cortas) y *fallback* automático del lado del servidor si el modelo rechaza una petición. Se puede cambiar con el secreto `VOICE_MODEL`.
- **Honestidad incluida en el saludo:** « Ici Sofía, l'adjointe IA d'AI Staff. Cet appel est transcrit… ». No se graba el audio; solo se guarda la transcripción.
- **Seguridad:** cada petición de Twilio se valida con la firma `X-Twilio-Signature`. Sin `TWILIO_AUTH_TOKEN`, la línea responde con un mensaje de « en configuration » y cuelga, sin llamar a Claude.

## Activación (lo que falta, ~5 minutos)

### 1. Dos secretos en Supabase
Supabase → proyecto **MEETAISTAFF BUSINESS** → **Edge Functions → Secrets** → agregar:

| Nombre | Dónde se obtiene |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `TWILIO_AUTH_TOKEN` | console.twilio.com → página principal (Account Info → Auth Token) |

(Alternativa: guardarlos en **Vault** con esos mismos nombres; la función lee de los dos lados.)

### 2. Quitar el número de Vapi
dashboard.vapi.ai → **Phone Numbers** → +1 438 805 8804 → borrar/liberar el número **en Vapi** (no en Twilio). Así Vapi deja de reescribir la configuración del número. El asistente « Alex » de Vapi ya no se usa; se puede borrar también.

### 3. Apuntar el número a la función
console.twilio.com → **Phone Numbers → Manage → Active numbers** → +1 438 805 8804 → **Voice Configuration**:
- *Configure with:* Webhook, TwiML Bin, Function…
- *A call comes in:* **Webhook** · `https://vqvdmcxkkmkyxpfnxmzo.supabase.co/functions/v1/voice` · **HTTP POST**
- Guardar.

### 4. Probar
Llamar al 438-805-8804, hablar un minuto y colgar. En 1 o 2 minutos la llamada aparece en la tabla `calls` de Supabase con resumen, idioma y `qualified`.

## Diagnóstico
- **Logs:** Supabase → Edge Functions → `voice` → Logs. Mensajes útiles: `rejected request: bad or missing Twilio signature` (falta o está mal el `TWILIO_AUTH_TOKEN`) y `reply failed` (problema con Claude o la clave).
- **Llamadas en curso o sin procesar:** `select call_sid, lang, jsonb_array_length(turns), last_activity, finalized_at from voice_sessions order by last_activity desc;`
- **Cron:** `select status, start_time from cron.job_run_details order by start_time desc limit 5;`

## Costos aproximados
- Twilio: minutos de voz + reconocimiento de voz de `<Gather>` + voces Polly (facturado por Twilio).
- Anthropic: un mensaje corto por turno + un análisis por llamada.
- Supabase y Make: dentro del plan Free (la voz ya no usa operaciones de Make).
