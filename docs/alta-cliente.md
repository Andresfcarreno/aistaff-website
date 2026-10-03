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

## Pasos para dar de alta a un cliente
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
