-- AI Staff — voz propia (Twilio <Gather> + Claude en la Edge Function `voice`)
-- YA APLICADO en el proyecto "MEETAISTAFF BUSINESS" (migración voice_sessions_secrets_sweep).
-- Ver docs/voz-propia.md.

-- Estado de cada llamada en curso
create table if not exists public.voice_sessions (
  call_sid       text primary key,
  from_number    text,
  to_number      text,
  lang           text not null default 'fr' check (lang in ('fr','en','es')),
  turns          jsonb not null default '[]'::jsonb,   -- [{role:'assistant'|'user', text, at}]
  silences       int not null default 0,
  started_at     timestamptz not null default now(),
  last_activity  timestamptz not null default now(),
  ended          boolean not null default false,
  finalized_at   timestamptz
);
create index if not exists voice_sessions_pending_idx on public.voice_sessions (last_activity) where finalized_at is null;
alter table public.voice_sessions enable row level security;
-- Sin políticas: solo la service_role (la Edge Function) lee y escribe.

-- Secretos en Supabase Vault (alternativa a los secretos de Edge Functions).
-- Solo la service_role puede leerlos.
create or replace function public.get_app_secret(secret_name text)
returns text
language sql
security definer
set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = secret_name limit 1
$$;
revoke execute on function public.get_app_secret(text) from public, anon, authenticated;
grant execute on function public.get_app_secret(text) to service_role;

-- Barrido: cada minuto, si hay llamadas terminadas sin procesar, se llama a la función
-- para analizarlas y pasarlas a `calls` (cubre el caso en que la persona cuelga).
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create or replace function public.voice_sweep_if_needed()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.voice_sessions
    where finalized_at is null and last_activity < now() - interval '90 seconds'
  ) then
    perform net.http_post(
      url := 'https://vqvdmcxkkmkyxpfnxmzo.supabase.co/functions/v1/voice?step=sweep',
      body := '{}'::jsonb,
      timeout_milliseconds := 60000
    );
  end if;
end $$;
revoke execute on function public.voice_sweep_if_needed() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'voice-sweep';
select cron.schedule('voice-sweep', '* * * * *', 'select public.voice_sweep_if_needed()');
