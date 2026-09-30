-- AI Staff — briefings por llamada (Tarea 5)
-- Ejecutar en Supabase → SQL Editor. Idempotente.
--
-- Supuesto: ya existe una tabla de clientes multi-tenant con `dashboard_token`.
-- Si se llama distinto a `clients`, cambia la referencia en las 3 tablas.

create extension if not exists pgcrypto;

-- 1) Perfil del dueño: a quién llamar, cuándo y con qué asistente
create table if not exists owner_profiles (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references clients(id) on delete cascade,
  owner_name       text not null,
  owner_phone      text not null,                  -- E.164, ej. +15145551234 (sirve para reconocerlo al llamar)
  lang             text not null default 'fr' check (lang in ('fr','en','es')),
  timezone         text not null default 'America/Toronto',
  persona          text not null default 'sofia' check (persona in ('sofia','alex','tomas')),
  briefing_slots   jsonb not null default '[{"time":"07:30","kind":"morning","on":true},{"time":"18:00","kind":"evening","on":true}]',
  consent_at       timestamptz,                     -- NULL = no se le llama. Guardar fecha del consentimiento explícito.
  paused_until     timestamptz,                     -- pausa temporal ("no me llames esta semana")
  google_calendar_id text default 'primary',
  instagram_user_id  text,                          -- IG Business account id (Graph API)
  facebook_page_id   text,
  created_at       timestamptz not null default now(),
  unique (owner_phone)
);

-- 2) Cada briefing (programado, llamado, terminado)
create table if not exists briefings (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references clients(id) on delete cascade,
  owner_id       uuid not null references owner_profiles(id) on delete cascade,
  kind           text not null check (kind in ('morning','midday','evening','on_demand')),
  scheduled_for  timestamptz not null,
  status         text not null default 'pending'
                 check (status in ('pending','calling','completed','no_answer','failed','skipped')),
  context        jsonb,          -- datos crudos juntados por Make (agenda, correos, llamadas, métricas)
  script         text,           -- texto que redactó Claude
  retell_call_id text,
  duration_sec   int,
  transcript     jsonb,          -- [{speaker:'agent'|'user', text:'...'}]
  summary        text,
  created_at     timestamptz not null default now(),
  unique (owner_id, kind, scheduled_for)       -- evita llamadas duplicadas si Make corre dos veces
);
create index if not exists briefings_client_idx on briefings (client_id, scheduled_for desc);

-- 3) Acciones que el dueño pidió por teléfono ("respóndele a Julie que confirmo")
create table if not exists assistant_actions (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  briefing_id  uuid references briefings(id) on delete set null,
  source_call  text,                         -- retell call id
  type         text not null check (type in ('draft_email','move_appointment','create_appointment','note','other')),
  payload      jsonb not null,               -- ej. {"to":"julie@…","intent":"confirmar jueves"}
  status       text not null default 'pending' check (status in ('pending','done','needs_human','failed')),
  result       jsonb,                        -- ej. {"gmail_draft_id":"…"}
  created_at   timestamptz not null default now()
);
create index if not exists actions_client_idx on assistant_actions (client_id, created_at desc);

-- Seguridad: RLS activado y SIN políticas públicas.
-- Solo la service_role key (guardada en Make, nunca en HTML) puede leer/escribir.
-- El dashboard debe leer vía una función serverless / Make que valide dashboard_token.
alter table owner_profiles    enable row level security;
alter table briefings         enable row level security;
alter table assistant_actions enable row level security;

-- Vista práctica para Make: slots que tocan en los próximos 15 minutos
create or replace view due_briefings as
select
  o.id as owner_id, o.client_id, o.owner_name, o.owner_phone, o.lang, o.persona, o.timezone,
  s->>'kind' as kind,
  ((now() at time zone o.timezone)::date + (s->>'time')::time) at time zone o.timezone as scheduled_for
from owner_profiles o
cross join lateral jsonb_array_elements(o.briefing_slots) s
where o.consent_at is not null
  and (o.paused_until is null or o.paused_until < now())
  and coalesce((s->>'on')::boolean, false)
  and ((now() at time zone o.timezone)::date + (s->>'time')::time) at time zone o.timezone
      between now() - interval '5 minutes' and now() + interval '10 minutes'
  and not exists (
    select 1 from briefings b
    where b.owner_id = o.id and b.kind = s->>'kind'
      and b.scheduled_for = ((now() at time zone o.timezone)::date + (s->>'time')::time) at time zone o.timezone
  );
