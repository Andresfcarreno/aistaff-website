# Alta de un cliente (número propio, guion propio, reporte al dueño)

Desde el 3 de octubre de 2026 la voz atiende a **varios negocios**. Cada cliente es una fila en `tenants`; el número de Twilio que llaman decide qué guion se usa.

## Cómo funciona
1. Alguien llama al número del cliente. Twilio pasa la llamada a la función `voice` de Supabase (o directo al Worker `voice-relay`; los dos caminos sirven).
2. Se busca `tenants.twilio_number` = número llamado.
   - Si existe y tiene `business_info`: la asistente saluda con `greeting` (o con un saludo genérico en francés con el nombre del negocio) y contesta **solo** con `business_info`. Toma mensajes y solicitudes de cita; nunca confirma citas ni inventa precios.
   - Si no: es la línea demo de AI Staff (Sofía vendiendo AI Staff).
3. Al colgar, el cron `voice-sweep` analiza la llamada:
   - Cliente: guarda la llamada con su `tenant_id` (el dueño la ve en su panel) y le manda un **SMS con el resumen** a `notify_phone`, en `report_lang` (español por defecto). No crea leads de AI Staff.
   - Demo: igual que antes (llamada + lead si hay interés).

Código: `voice-relay/src/prompt.ts` (`clientGreeting`, `clientSystem`), `voice-relay/src/call.ts` (`loadTenant`), `supabase/functions/voice/index.ts` (`clientTenant`, `finalizeClient`, `notifyOwner`). El guion del cliente está en los dos archivos y debe ser igual.

## Alta automática desde el formulario (recomendado, 3 oct. 2026)
Si el cliente llenó `/onboarding/`, su fila ya está en `leads`. La función `client-setup` lee sus respuestas, le pide a Claude que escriba el guion (`business_info`, en español para revisarlo) y el saludo en francés, y crea la fila en `tenants`. **No inventa nada**: lo que falta en el formulario queda como "no indicado" y la función devuelve una lista `missing` con lo que hay que preguntarle al dueño.

1. **Twilio** (cuenta pagada): comprar el número y apuntar *Voice* al webhook de la función `voice` (igual que el +1 438 805 8804) y *Messaging* a `messages-in`.
2. **Supabase → SQL Editor**: buscar el lead y pegar esto (cambiar el correo y el número):

```sql
-- 1) Borrador sin guardar nada (para revisar el guion):
select net.http_post(
  url := 'https://vqvdmcxkkmkyxpfnxmzo.supabase.co/functions/v1/client-setup',
  body := jsonb_build_object('lead_id', (select id::text from leads where email = 'dueno@ejemplo.com' order by created_at desc limit 1), 'dry_run', true),
  headers := jsonb_build_object('Content-Type','application/json','x-notify-key',(select decrypted_secret from vault.decrypted_secrets where name='NOTIFY_KEY')),
  timeout_milliseconds := 120000);
-- Un minuto después, ver el resultado (el número que devolvió la línea anterior):
-- select content from net._http_response where id = <número>;

-- 2) Alta de verdad (con el número de Twilio comprado; notify_phone es opcional, por defecto el teléfono del formulario):
select net.http_post(
  url := 'https://vqvdmcxkkmkyxpfnxmzo.supabase.co/functions/v1/client-setup',
  body := jsonb_build_object('lead_id', (select id::text from leads where email = 'dueno@ejemplo.com' order by created_at desc limit 1), 'twilio_number', '+15145550000'),
  headers := jsonb_build_object('Content-Type','application/json','x-notify-key',(select decrypted_secret from vault.decrypted_secrets where name='NOTIFY_KEY')),
  timeout_milliseconds := 120000);
```

3. Hacer la **prueba de 15 minutos** con el dueño (paso 4 de abajo) y completar con `update tenants set business_info = $$…$$` lo que salió en `missing`.
4. O más simple: pedirle a una sesión de Claude Code "alta de <negocio> con el número +1…" y la hace.

El lead queda con `status = 'client'` y `payload.tenant_id`. Con `"replace": true` se rehace el guion de un cliente que ya tiene ese número.

## Citas
Cuando un cliente del negocio pide una cita por teléfono, la asistente toma los datos sin confirmar nada. Al colgar, el análisis guarda la solicitud en `bookings` (`status = 'requested'`, con día y hora si la persona dio una fecha concreta). El dueño la ve en la agenda de su panel como "por confirmar" y en el SMS de resumen.

## Alta manual (sin formulario)
1. **Twilio** (cuenta pagada): comprar un número local de Montreal (514/438). En *Voice configuration*, "A call comes in" → Webhook → la misma URL que el +1 438 805 8804 (función `voice` de Supabase). En *Messaging*, el webhook de `messages-in` (igual que el número demo).
2. **Supabase**, SQL Editor (cambiar los valores):

```sql
insert into public.tenants (name, owner_email, twilio_number, notify_phone, report_lang, lang, plan, business_info, greeting)
values (
  'Garage Los Santos',                 -- nombre que dice la asistente
  'dueno@ejemplo.com',                 -- correo con el que el dueño entra a meetaistaff.com/demo/
  '+15145550000',                      -- número de Twilio comprado (formato +1…)
  '+15145559999',                      -- celular del dueño para el SMS de resumen
  'es',                                -- idioma del resumen: es, fr o en
  'fr', 'essentiel',
  $$Taller mecánico en Saint-Michel, Montreal. Dirección: …
Horario: lunes a viernes de 8:30 a 17:30. Cerrado sábado y domingo.
Servicios: cambio de aceite, frenos, suspensión, diagnóstico.
Precios: no dar precios; ofrecer cotización.
Preguntas frecuentes: … (copiar del formulario /onboarding/)
Si piden cita: tomar nombre, auto, problema, día y hora preferidos.$$,
  null                                 -- saludo propio (opcional); null = saludo genérico en francés
);
```

3. **El dueño** desvía a su número de AI Staff las llamadas que no contesta ("si no contesto / si está ocupado", lo ofrece cualquier operador).
4. **Prueba de 15 minutos** con el dueño: llama a su número, hace las preguntas de sus clientes, y se ajusta `business_info` con un `update tenants set business_info = $$…$$ where name = '…';` (efecto inmediato, sin desplegar nada).

## Requisitos
- Twilio pagado (en modo prueba no se pueden mandar SMS a números no verificados).
- Secreto `TWILIO_ACCOUNT_SID` en Supabase (Edge Functions → Secrets o Vault) para el SMS al dueño. `TWILIO_AUTH_TOKEN` ya existe.
- Panel por cliente: la seguridad (RLS) filtra por `tenants.owner_email`, así que el dueño solo ve lo suyo.
