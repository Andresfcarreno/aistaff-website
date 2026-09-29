# Make + Supabase: estado real (29 sept. 2026)

## Cuentas
| Servicio | Detalle |
|---|---|
| **Make** | Cuenta meetaistaff@gmail.com · organización "My Organization" (9141399) · equipo "My Team" (3067204) · zona `us2.make.com` · **plan Free**: 2 escenarios activos como máximo, 1 000 operaciones/mes, intervalo mínimo de 15 min |
| **Supabase** | Proyecto **MEETAISTAFF BUSINESS** · ref `vqvdmcxkkmkyxpfnxmzo` · región `us-east-2` · URL `https://vqvdmcxkkmkyxpfnxmzo.supabase.co` |
| **Conexiones en Make** | "andres's Anthropic Claude connection" (11400290) y "andres's Supabase connection" (11400726, con la service_role; por eso RLS sin políticas funciona) |

## Tablas (esquema `public`, todas con RLS y sin políticas)
| Tabla | Para qué | SQL |
|---|---|---|
| `calls` | Una fila por llamada terminada en la línea demo | `backend/supabase/000_calls_bookings.sql` |
| `bookings` | Citas ligadas a una llamada (aún sin uso) | idem |
| `leads` | Prospectos del formulario `/onboarding/` | `backend/supabase/002_leads.sql` |

`001_briefings.sql` (backend del briefing) **no está aplicado**: depende de una tabla `clients` que todavía no existe y de 4 escenarios de Make que no caben en el plan Free.

## Escenario 1: "Vapi fin de llamada" (id 6450247) — activo
```
Vapi (end-of-call-report) ──► Webhook 2873422 ──► [filtro: message.type = end-of-call-report]
   ──► Claude Sonnet 5.5 (analiza la transcripción, devuelve JSON)
   ──► Parse JSON (estructura 515936) ──► Supabase: insert en calls
```
- **Webhook:** `https://hook.us2.make.com/5uei5v69nkb4kwmgxh9v9gakvpy8m0mw` (configurado como Server URL del asistente en Vapi).
- **Costo:** 4 operaciones por llamada, más 1 por cada evento de Vapi que no sea `end-of-call-report`. Por eso en Vapi hay que dejar *Server Messages* solo en `end-of-call-report` (ver `docs/vapi-asistente-sofia.md`).
- **Mapeo:** transcripción `message.artifact.transcript`, grabación `message.artifact.recordingUrl`, fechas `message.startedAt` / `message.endedAt`, duración `message.durationSeconds`, número `message.customer.number`, asistente `message.assistant.id`, id `message.call.id`.

### Trampas encontradas (no repetir)
1. **Sin filtro**, cada `status-update` y `speech-update` de Vapi disparaba Claude y Supabase: 146 ejecuciones fallidas y la cola llena.
2. **Con Sonnet 5.5, el campo `textResponse` del módulo de Claude viene vacío.** El texto está en `content[].text`. El Parse JSON usa `join(map(2.content; "text"); emptystring)` (y quita ``` por si acaso).
3. En `end-of-call-report`, la transcripción y las fechas están en `message.*`, **no** en `message.call.*` (ahí no existen).
4. El conector de Supabase declara todas las columnas como texto: `duration_sec` va con `toString(round(...))` y un objeto entero (`{{1}}`) en un campo de texto falla con "Validation failed for 1 parameter(s)".
5. El módulo de Claude no acepta `thinking: disabled` con Sonnet 5.5, y `max_tokens` debe ser número.

## Escenario 2: "AI Staff onboarding → Supabase leads" (id 6451758) — activo
```
/onboarding/ (fetch no-cors, text/plain) ──► Webhook 2874072 (JSON pass-through)
   ──► [filtro: "c1": true y un email válido] ──► Supabase: insert en leads (payload)
```
- **Webhook:** `https://hook.us2.make.com/h45to1mdxrpdfnbeorgnntrr4t138a29`, ya pegado en `onboarding/index.html` (`ONBOARDING_WEBHOOK`).
- El trigger `leads_fill` de Supabase convierte el texto en JSON y rellena nombre, email, sector, plan, consentimientos, etc. Costo: **2 operaciones por formulario**.
- El filtro descarta envíos sin consentimiento o sin email (protección básica contra spam; la URL del webhook es pública por diseño, no es una clave).
- **Probado** el 29 sept. con un envío real a la URL; la fila de prueba se borró.

### Aviso por correo (pendiente, 1 clic de Andrés)
Hoy el lead queda en Supabase, pero nadie recibe un aviso. Para recibir un correo en cada formulario:
1. Make → escenario 2 → agregar después de Supabase un módulo **Gmail → Send an email** (conectar meetaistaff@gmail.com).
2. Para: hello@meetaistaff.com · Asunto: `Nouveau lead : {{2.biz_name}} ({{2.sector}})` · Cuerpo: nombre, email, teléfono, plan y `ref`, mapeados desde la salida del módulo de Supabase.
Suma 1 operación por formulario. Resend no está conectado en Make todavía.

## Presupuesto de operaciones (plan Free, 1 000/mes)
| Uso | Operaciones |
|---|---|
| Ya gastadas el 29 sept. (depuración) | ~460 |
| Por llamada a la línea demo | 4 (≈ 14 si Vapi sigue mandando todos los eventos) |
| Por formulario de onboarding | 2 (3 con aviso por Gmail) |

Si se acerca el tope, Make pausa los escenarios hasta el siguiente ciclo. Un plan de pago de Make (Core o superior) quita el límite de 2 escenarios y sube las operaciones; hace falta para el backend del briefing (4 escenarios). Revisar el precio vigente en make.com/pricing.
