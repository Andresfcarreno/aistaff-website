-- AI Staff — prospectos del formulario /onboarding/ (web → Make → Supabase)
-- YA APLICADO en el proyecto "MEETAISTAFF BUSINESS" (migración leads_onboarding_and_hardening).
-- Idempotente.

-- Hardening: la función del event trigger que activa RLS no debe poder llamarse vía /rpc
revoke execute on function public.rls_auto_enable() from anon, authenticated, public;

create table if not exists public.leads (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  status            text not null default 'new'
                    check (status in ('new','contacted','demo_built','discovery_call','won','lost')),
  first_name        text,
  last_name         text,
  email             text,
  phone             text,
  biz_name          text,
  sector            text,
  city              text,
  plan              text,
  form_lang         text,
  persona           text,
  ref               text,
  consent_demo      boolean,
  consent_marketing boolean,           -- CASL: solo escribir con marketing si es true
  submitted_at      timestamptz,
  payload           jsonb not null     -- respuestas completas del formulario
);
create index if not exists leads_created_idx on public.leads (created_at desc);
alter table public.leads enable row level security;
-- Sin políticas: solo service_role (conexión de Make) lee/escribe.

-- Make manda el cuerpo del formulario como texto (JSON pass-through).
-- El trigger lo convierte en JSON y rellena las columnas, así el escenario usa 1 solo módulo.
create or replace function public.leads_fill_from_payload()
returns trigger language plpgsql as $$
declare p jsonb := new.payload;
begin
  if jsonb_typeof(p) = 'string' then
    p := (p #>> '{}')::jsonb;
  end if;
  new.payload           := p;
  new.first_name        := coalesce(new.first_name, p->>'firstName');
  new.last_name         := coalesce(new.last_name,  p->>'lastName');
  new.email             := coalesce(new.email,      lower(p->>'email'));
  new.phone             := coalesce(new.phone,      p->>'phone');
  new.biz_name          := coalesce(new.biz_name,   p->>'bizName');
  new.sector            := coalesce(new.sector,     case when p->>'sector' = 'autre' then 'autre: '||coalesce(p->>'sectorOther','') else p->>'sector' end);
  new.city              := coalesce(new.city,       p->>'city');
  new.plan              := coalesce(new.plan,       p->>'plan');
  new.form_lang         := coalesce(new.form_lang,  p->>'formLang');
  new.persona           := coalesce(new.persona,    p->>'persona');
  new.ref               := coalesce(new.ref,        p->>'ref');
  new.consent_demo      := coalesce(new.consent_demo,      (p->>'c1')::boolean);
  new.consent_marketing := coalesce(new.consent_marketing, (p->>'c3')::boolean);
  new.submitted_at      := coalesce(new.submitted_at, (p->>'submittedAt')::timestamptz);
  return new;
end $$;
revoke execute on function public.leads_fill_from_payload() from anon, authenticated, public;

drop trigger if exists leads_fill on public.leads;
create trigger leads_fill before insert on public.leads
for each row execute function public.leads_fill_from_payload();

-- Consultas útiles
-- select created_at, first_name, biz_name, sector, plan, email, phone, ref, status from leads order by created_at desc;
-- update leads set status = 'contacted' where email = '…';
