-- AI Staff — línea demo que se adapta al negocio de quien llama
-- Ejecutar en Supabase → SQL Editor. Idempotente.
-- Lo escribe Make (service role) al terminar cada llamada de la línea demo.
-- Nada es legible desde el navegador: RLS activo y SIN políticas para anon/authenticated.

create extension if not exists pgcrypto;

create table if not exists demo_calls (
  id              uuid primary key default gen_random_uuid(),
  retell_call_id  text unique,                      -- evita duplicados si Retell reintenta el webhook
  caller_phone    text,                             -- E.164, del propio llamante (from_number)
  lang            text check (lang in ('fr','en','es')),
  caller_name     text,
  biz_name        text,
  sector          text,                             -- immobilier, cvc, paysagement, ..., autre
  biz_summary     text,                             -- qué hace el negocio, en 1-2 frases
  customer_questions text,                          -- qué preguntan sus clientes cuando llaman
  hours           text,
  services        text,
  sms_consent     boolean not null default false,   -- dijo "sí" a que le mandemos el enlace por texto
  sms_sent_at     timestamptz,
  call_seconds    integer,
  transcript      text,
  recording_url   text,
  status          text not null default 'new' check (status in ('new','contacted','onboarded','closed','do_not_contact')),
  notes           text,
  created_at      timestamptz not null default now(),
  delete_after    timestamptz not null default (now() + interval '12 months')  -- igual que la política de privacidad
);

create index if not exists demo_calls_created_idx on demo_calls (created_at desc);
create index if not exists demo_calls_phone_idx   on demo_calls (caller_phone);

alter table demo_calls enable row level security;
-- Sin políticas a propósito: solo la clave service_role (Make) puede leer y escribir.

-- Borrado de lo vencido (ejecutar a mano o con pg_cron una vez al mes):
--   delete from demo_calls where delete_after < now() and status <> 'onboarded';
