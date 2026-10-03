-- AI Staff: aviso de cada lead nuevo (formulario /onboarding/ o llamada a la línea demo).
-- APLICADO el 3 oct. 2026 (sin cambios de esquema):
--   1. Secreto NOTIFY_KEY en el Vault (valor aleatorio; lo comparten el cron y la función).
--   2. Cron `lead-notify` cada minuto: llama a la Edge Function `lead-notify` solo si hay
--      leads recientes sin payload.notified_at. La función envía el correo/SMS y marca el lead.

select vault.create_secret(encode(extensions.gen_random_bytes(24), 'hex'), 'NOTIFY_KEY', 'lead-notify: clave del cron de leads')
where not exists (select 1 from vault.secrets where name = 'NOTIFY_KEY');

select cron.schedule('lead-notify', '* * * * *', $cmd$
select net.http_post(
  url := 'https://vqvdmcxkkmkyxpfnxmzo.supabase.co/functions/v1/lead-notify',
  body := '{}'::jsonb,
  headers := jsonb_build_object('Content-Type', 'application/json',
    'x-notify-key', (select decrypted_secret from vault.decrypted_secrets where name = 'NOTIFY_KEY' limit 1)),
  timeout_milliseconds := 30000)
where exists (
  select 1 from public.leads
  where created_at > greatest(timestamptz '2026-10-03 00:00+00', now() - interval '7 days')
    and payload->>'notified_at' is null)
$cmd$);

-- PENDIENTE (no se pudo aplicar desde la sesión; correr en el SQL Editor de Supabase):
-- aviso del linter "function_search_path_mutable".
-- alter function public.leads_fill_from_payload() set search_path = '';
