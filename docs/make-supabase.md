# Make + Supabase: estado real (30 sept. 2026)

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
| `voice_sessions` | Estado de cada llamada en curso (voz propia) | `backend/supabase/003_voice.sql` |
| `bookings` | Citas ligadas a una llamada (aún sin uso) | idem |
| `leads` | Prospectos del formulario `/onboarding/` | `backend/supabase/002_leads.sql` |

`001_briefings.sql` (backend del briefing) **no está aplicado**: depende de una tabla `clients` que todavía no existe.

## Llamadas de la línea demo: ya no pasan por Make
Desde el 30 sept. 2026, la voz es propia (Edge Function `voice` de Supabase, ver `docs/voz-propia.md`) y escribe directo en `calls`. El escenario "Vapi fin de llamada" (id 6450247) y su webhook se **borraron** de Make.

Lecciones de ese escenario, por si se vuelve a usar Make con Claude:
1. Con Sonnet 5.5, el campo `textResponse` del módulo de Claude viene **vacío**; el texto está en `content[].text` (`join(map(2.content; "text"); emptystring)`).
2. El conector de Supabase declara todas las columnas como texto: números con `toString(...)`, y un objeto entero en un campo de texto falla con "Validation failed for 1 parameter(s)".
3. El módulo de Claude no acepta `thinking: disabled` con Sonnet 5.5, y `max_tokens` debe ser número.
4. Filtrar siempre el tipo de evento justo después del webhook, para no gastar operaciones en eventos que no interesan.

## Escenario de Make activo: "AI Staff onboarding → Supabase leads" (id 6451758)
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
1. Make → escenario de onboarding → agregar después de Supabase un módulo **Gmail → Send an email** (conectar meetaistaff@gmail.com).
2. Para: hello@meetaistaff.com · Asunto: `Nouveau lead : {{2.biz_name}} ({{2.sector}})` · Cuerpo: nombre, email, teléfono, plan y `ref`, mapeados desde la salida del módulo de Supabase.
Suma 1 operación por formulario. Resend no está conectado en Make todavía.

## Presupuesto de operaciones (plan Free, 1 000/mes)
| Uso | Operaciones |
|---|---|
| Ya gastadas el 29 sept. (depuración) | ~460 |
| Por llamada a la línea demo | 0 (ya no pasa por Make) |
| Por formulario de onboarding | 2 (3 con aviso por Gmail) |

Si se acerca el tope, Make pausa los escenarios hasta el siguiente ciclo. Con la voz fuera de Make, el plan Free alcanza para el onboarding. Queda 1 escenario libre.
