-- AI Staff — llamadas de la línea demo (Vapi → Make → Supabase)
-- YA APLICADO en el proyecto Supabase "MEETAISTAFF BUSINESS" (vqvdmcxkkmkyxpfnxmzo, us-east-2).
-- Este archivo documenta el esquema; es idempotente por si hay que recrearlo.
--
-- Nota: la columna se llama `retell_call_id` por historia, pero hoy guarda el id de
-- llamada de Vapi (`message.call.id`). No se renombra para no romper el escenario de Make.

create table if not exists public.calls (
  id                   uuid primary key default gen_random_uuid(),
  retell_call_id       text unique,            -- id de llamada del proveedor de voz (Vapi)
  agent_id             text,                   -- id del asistente de Vapi
  phone_number         text,                   -- número de quien llama (E.164)
  caller_name          text,                   -- extraído por Claude
  language             text,                   -- fr / en / es (Claude)
  started_at           timestamptz,
  ended_at             timestamptz,
  duration_sec         integer,
  transcript           text,
  recording_url        text,
  summary              text,                   -- 2-3 frases en el idioma de la llamada (Claude)
  sentiment            text,                   -- positive / neutral / negative (Claude)
  intent               text,                   -- viewing_request / info / callback / other (Claude)
  qualified            boolean default false,  -- prospecto calificado (Claude)
  disconnection_reason text,                   -- endedReason de Vapi
  raw_payload          jsonb,                  -- sin uso (el payload completo de Vapi pesa ~30 KB)
  created_at           timestamptz default now()
);

create table if not exists public.bookings (
  id             uuid primary key default gen_random_uuid(),
  call_id        uuid references public.calls(id) on delete cascade,
  contact_name   text,
  contact_email  text,
  contact_phone  text,
  booking_type   text,
  scheduled_for  timestamptz,
  status         text default 'pending',
  notes          text,
  created_at     timestamptz default now()
);

-- RLS activado y sin políticas: solo la service_role (conexión de Make) lee y escribe.
alter table public.calls    enable row level security;
alter table public.bookings enable row level security;
