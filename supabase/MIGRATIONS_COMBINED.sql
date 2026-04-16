create extension if not exists pgcrypto;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan text not null default 'trial' check (plan in ('trial', 'starter', 'pro', 'enterprise')),
  whatsapp_instance text,
  whatsapp_status text not null default 'disconnected',
  timezone text not null default 'America/Sao_Paulo',
  settings jsonb not null default '{}'::jsonb,
  trial_ends_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address text,
  city text,
  state text,
  phone text,
  is_active boolean not null default true,
  working_hours jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.organization_users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  role text not null default 'staff' check (role in ('owner', 'admin', 'manager', 'staff', 'professional')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, user_id)
);

create index organizations_plan_idx on public.organizations(plan);
create index organizations_whatsapp_instance_idx on public.organizations(whatsapp_instance);
create index units_organization_id_idx on public.units(organization_id);
create index units_active_idx on public.units(organization_id, is_active);
create index organization_users_lookup_idx on public.organization_users(user_id, organization_id);
create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  bio text,
  avatar_url text,
  phone text,
  commission_pct numeric(5, 2) not null default 0,
  is_active boolean not null default true,
  working_hours jsonb not null default '{}'::jsonb,
  blocked_times jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  category text,
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  price numeric(10, 2) not null check (price >= 0),
  deposit_required boolean not null default false,
  deposit_amount numeric(10, 2) check (deposit_amount >= 0),
  deposit_pct numeric(5, 2) check (deposit_pct between 0 and 100),
  cancellation_policy_hours integer not null default 24 check (cancellation_policy_hours >= 0),
  cancellation_penalty_pct numeric(5, 2) not null default 100 check (cancellation_penalty_pct between 0 and 100),
  is_active boolean not null default true,
  color text not null default '#6366f1',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.service_professionals (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  custom_price numeric(10, 2) check (custom_price >= 0),
  custom_duration_minutes integer check (custom_duration_minutes > 0),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (service_id, professional_id)
);

create index professionals_org_unit_idx on public.professionals(organization_id, unit_id);
create index professionals_active_idx on public.professionals(organization_id, is_active);
create index services_org_active_idx on public.services(organization_id, is_active);
create index service_professionals_org_idx on public.service_professionals(organization_id, professional_id);
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  phone text not null,
  phone_normalized text generated always as (regexp_replace(phone, '[^0-9]', '', 'g')) stored,
  email text,
  birthdate date,
  notes text,
  tags text[] not null default '{}'::text[],
  preferred_professional_id uuid references public.professionals(id) on delete set null,
  last_appointment_at timestamptz,
  total_appointments integer not null default 0,
  total_spent numeric(10, 2) not null default 0,
  ltv numeric(10, 2) not null default 0,
  nps_score integer check (nps_score between 0 and 10),
  last_nps_at timestamptz,
  status text not null default 'active' check (status in ('active', 'inactive', 'blocked')),
  source text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, phone_normalized)
);

create table public.client_tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  color text not null default '#6366f1',
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, name)
);

create index clients_org_status_idx on public.clients(organization_id, status);
create index clients_last_appointment_idx on public.clients(organization_id, last_appointment_at desc);
create index clients_phone_search_idx on public.clients(organization_id, phone_normalized);
create extension if not exists btree_gist;

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  professional_id uuid not null references public.professionals(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'draft'
    check (status in ('draft', 'pending_payment', 'confirmed', 'cancelled', 'completed', 'no_show', 'refunded')),
  price numeric(10, 2) not null check (price >= 0),
  deposit_required boolean not null default false,
  deposit_amount numeric(10, 2) check (deposit_amount >= 0),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'partial', 'paid', 'refunded', 'cancelled')),
  confirmation_status text not null default 'pending'
    check (confirmation_status in ('pending', 'confirmed', 'declined', 'no_response')),
  reminder_sent_at timestamptz,
  confirmed_at timestamptz,
  source text not null default 'whatsapp'
    check (source in ('whatsapp', 'panel', 'site', 'link', 'api')),
  notes text,
  internal_notes text,
  cancelled_at timestamptz,
  cancellation_reason text,
  completed_at timestamptz,
  no_show_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint appointments_time_range_check check (end_at > start_at)
);

alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    professional_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  )
  where (status in ('draft', 'pending_payment', 'confirmed'));

create table public.appointment_status_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  reason text,
  created_at timestamptz not null default timezone('utc', now())
);

create index appointments_org_start on public.appointments(organization_id, start_at);
create index appointments_professional on public.appointments(professional_id, start_at);
create index appointments_client on public.appointments(client_id);
create index appointments_status on public.appointments(organization_id, status);
create index appointments_confirmation_status_idx on public.appointments(organization_id, confirmation_status);
create index appointment_status_history_lookup_idx on public.appointment_status_history(organization_id, appointment_id, created_at desc);
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  amount numeric(10, 2) not null check (amount >= 0),
  type text not null check (type in ('deposit', 'balance', 'full', 'refund')),
  method text check (method in ('pix', 'credit_card', 'debit_card', 'cash', 'transfer')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled')),
  provider text check (provider in ('mercadopago', 'stripe', 'manual')),
  provider_payment_id text,
  provider_payment_intent text,
  pix_qr_code text,
  pix_qr_code_base64 text,
  pix_expires_at timestamptz,
  paid_at timestamptz,
  refunded_at timestamptz,
  refund_amount numeric(10, 2) check (refund_amount >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete cascade,
  amount numeric(10, 2) not null check (amount >= 0),
  reason text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  provider_refund_id text,
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.wallet_credits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  amount numeric(10, 2) not null check (amount >= 0),
  origin_payment_id uuid references public.payments(id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index payments_provider_payment_id_uq on public.payments(provider_payment_id) where provider_payment_id is not null;
create unique index payments_provider_payment_intent_uq on public.payments(provider_payment_intent) where provider_payment_intent is not null;
create index payments_lookup_idx on public.payments(organization_id, appointment_id, status);
create index wallet_credits_client_idx on public.wallet_credits(organization_id, client_id, used_at);
create table public.conversation_threads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  phone text not null,
  phone_normalized text generated always as (regexp_replace(phone, '[^0-9]', '', 'g')) stored,
  channel text not null default 'whatsapp',
  status text not null default 'open' check (status in ('open', 'resolved', 'bot', 'human')),
  current_agent text,
  context jsonb not null default '{}'::jsonb,
  last_message_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, phone_normalized, channel)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.conversation_threads(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  content text,
  media_url text,
  media_type text,
  message_type text not null default 'text',
  whatsapp_message_id text,
  agent text,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index messages_whatsapp_message_id_uq on public.messages(whatsapp_message_id) where whatsapp_message_id is not null;
create index messages_thread on public.messages(thread_id, created_at);
create index messages_org on public.messages(organization_id, created_at desc);
create table public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workflow_name text not null,
  trigger_type text,
  related_id uuid,
  status text not null default 'running' check (status in ('running', 'success', 'error', 'skipped')),
  input jsonb,
  output jsonb,
  error text,
  duration_ms integer,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  type text not null,
  channel text not null default 'whatsapp',
  status text not null default 'sent' check (status in ('sent', 'delivered', 'read', 'failed')),
  content text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.metrics_daily (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  unit_id uuid references public.units(id) on delete cascade,
  date date not null,
  appointments_total integer not null default 0,
  appointments_confirmed integer not null default 0,
  appointments_cancelled integer not null default 0,
  appointments_no_show integer not null default 0,
  appointments_completed integer not null default 0,
  revenue_total numeric(10, 2) not null default 0,
  revenue_deposits numeric(10, 2) not null default 0,
  revenue_lost_no_show numeric(10, 2) not null default 0,
  new_clients integer not null default 0,
  returning_clients integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, unit_id, date)
);

create table public.agent_configs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  agent_key text not null,
  name text not null,
  tone text not null default 'amigável',
  is_active boolean not null default true,
  prompt_overrides jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, agent_key)
);

create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  key text not null,
  title text not null,
  body text not null,
  variables text[] not null default '{}'::text[],
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, key)
);

create index automation_runs_org_status_idx on public.automation_runs(organization_id, status, created_at desc);
create index notification_logs_org_type_idx on public.notification_logs(organization_id, type, created_at desc);
create index metrics_daily_org_date_idx on public.metrics_daily(organization_id, date desc);
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, anon, service_role;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function private.get_user_org_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select organization_id
  from public.organization_users
  where user_id = auth.uid()
    and is_active = true
  order by created_at asc
  limit 1;
$$;

create or replace function private.has_org_access(target_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_users
    where organization_id = target_org_id
      and user_id = auth.uid()
      and is_active = true
  );
$$;

create or replace function private.has_org_role(target_org_id uuid, allowed_roles text[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_users
    where organization_id = target_org_id
      and user_id = auth.uid()
      and is_active = true
      and role = any(allowed_roles)
  );
$$;

grant execute on function private.get_user_org_id() to authenticated, anon, service_role;
grant execute on function private.has_org_access(uuid) to authenticated, anon, service_role;
grant execute on function private.has_org_role(uuid, text[]) to authenticated, anon, service_role;

create or replace function public.enforce_appointment_state_transition()
returns trigger
language plpgsql
as $$
begin
  if tg_op <> 'UPDATE' or new.status = old.status then
    return new;
  end if;

  if not (
    (old.status = 'draft' and new.status in ('pending_payment', 'confirmed', 'cancelled')) or
    (old.status = 'pending_payment' and new.status in ('confirmed', 'cancelled', 'refunded')) or
    (old.status = 'confirmed' and new.status in ('completed', 'cancelled', 'no_show', 'refunded')) or
    (old.status = 'completed' and new.status in ('refunded')) or
    (old.status = 'cancelled' and new.status in ('refunded')) or
    (old.status = 'no_show' and new.status in ('refunded'))
  ) then
    raise exception 'Invalid appointment transition: % -> %', old.status, new.status;
  end if;

  if new.status = 'confirmed' and new.confirmed_at is null then
    new.confirmed_at = timezone('utc', now());
  elsif new.status = 'completed' and new.completed_at is null then
    new.completed_at = timezone('utc', now());
  elsif new.status = 'cancelled' and new.cancelled_at is null then
    new.cancelled_at = timezone('utc', now());
  elsif new.status = 'no_show' and new.no_show_at is null then
    new.no_show_at = timezone('utc', now());
  end if;

  return new;
end;
$$;

create or replace function public.audit_appointment_status_change()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.appointment_status_history (
      organization_id,
      appointment_id,
      from_status,
      to_status,
      changed_by,
      reason
    )
    values (
      new.organization_id,
      new.id,
      null,
      new.status,
      auth.uid(),
      'appointment_created'
    );
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.appointment_status_history (
      organization_id,
      appointment_id,
      from_status,
      to_status,
      changed_by,
      reason
    )
    values (
      new.organization_id,
      new.id,
      old.status,
      new.status,
      auth.uid(),
      coalesce(new.cancellation_reason, 'status_changed')
    );
  end if;

  return new;
end;
$$;

create or replace function public.skinnia_fetch_24h_reminders()
returns table (
  organization_id uuid,
  appointment_id uuid,
  client_name text,
  phone text,
  service_name text,
  professional_name text,
  start_label text
)
language sql
stable
as $$
  select
    appointments.organization_id,
    appointments.id,
    clients.name,
    clients.phone,
    services.name,
    professionals.name,
    to_char(appointments.start_at at time zone coalesce(organizations.timezone, 'America/Sao_Paulo'), 'DD/MM HH24:MI') as start_label
  from public.appointments
  join public.clients on clients.id = appointments.client_id
  join public.services on services.id = appointments.service_id
  join public.professionals on professionals.id = appointments.professional_id
  join public.organizations on organizations.id = appointments.organization_id
  where appointments.status = 'confirmed'
    and appointments.reminder_sent_at is null
    and appointments.start_at between timezone('utc', now()) + interval '23 hours' and timezone('utc', now()) + interval '25 hours';
$$;

create or replace function public.skinnia_fetch_2h_reminders()
returns table (
  organization_id uuid,
  appointment_id uuid,
  client_name text,
  phone text,
  service_name text,
  professional_name text,
  start_label text
)
language sql
stable
as $$
  select
    appointments.organization_id,
    appointments.id,
    clients.name,
    clients.phone,
    services.name,
    professionals.name,
    to_char(appointments.start_at at time zone coalesce(organizations.timezone, 'America/Sao_Paulo'), 'DD/MM HH24:MI') as start_label
  from public.appointments
  join public.clients on clients.id = appointments.client_id
  join public.services on services.id = appointments.service_id
  join public.professionals on professionals.id = appointments.professional_id
  join public.organizations on organizations.id = appointments.organization_id
  where appointments.status = 'confirmed'
    and appointments.confirmation_status = 'pending'
    and appointments.start_at between timezone('utc', now()) + interval '1 hour 50 minutes' and timezone('utc', now()) + interval '2 hours 10 minutes';
$$;

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger units_set_updated_at
before update on public.units
for each row execute function public.set_updated_at();

create trigger organization_users_set_updated_at
before update on public.organization_users
for each row execute function public.set_updated_at();

create trigger professionals_set_updated_at
before update on public.professionals
for each row execute function public.set_updated_at();

create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create trigger refunds_set_updated_at
before update on public.refunds
for each row execute function public.set_updated_at();

create trigger wallet_credits_set_updated_at
before update on public.wallet_credits
for each row execute function public.set_updated_at();

create trigger conversation_threads_set_updated_at
before update on public.conversation_threads
for each row execute function public.set_updated_at();

create trigger agent_configs_set_updated_at
before update on public.agent_configs
for each row execute function public.set_updated_at();

create trigger message_templates_set_updated_at
before update on public.message_templates
for each row execute function public.set_updated_at();

create trigger appointments_state_machine
before update on public.appointments
for each row execute function public.enforce_appointment_state_transition();

create trigger appointments_status_history_insert
after insert on public.appointments
for each row execute function public.audit_appointment_status_change();

create trigger appointments_status_history_update
after update of status on public.appointments
for each row execute function public.audit_appointment_status_change();

alter table public.organizations enable row level security;
alter table public.units enable row level security;
alter table public.organization_users enable row level security;
alter table public.professionals enable row level security;
alter table public.services enable row level security;
alter table public.service_professionals enable row level security;
alter table public.clients enable row level security;
alter table public.client_tags enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_status_history enable row level security;
alter table public.payments enable row level security;
alter table public.refunds enable row level security;
alter table public.wallet_credits enable row level security;
alter table public.conversation_threads enable row level security;
alter table public.messages enable row level security;
alter table public.automation_runs enable row level security;
alter table public.notification_logs enable row level security;
alter table public.metrics_daily enable row level security;
alter table public.agent_configs enable row level security;
alter table public.message_templates enable row level security;

create policy organizations_select
on public.organizations
for select
using (private.has_org_access(id));

create policy organizations_update
on public.organizations
for update
using (private.has_org_role(id, array['owner', 'admin']))
with check (private.has_org_role(id, array['owner', 'admin']));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'units',
    'organization_users',
    'professionals',
    'services',
    'service_professionals',
    'clients',
    'client_tags',
    'appointments',
    'appointment_status_history',
    'payments',
    'refunds',
    'wallet_credits',
    'conversation_threads',
    'messages',
    'automation_runs',
    'notification_logs',
    'metrics_daily',
    'agent_configs',
    'message_templates'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select using (private.has_org_access(organization_id));',
      table_name || '_select',
      table_name
    );
  end loop;

  foreach table_name in array array[
    'units',
    'professionals',
    'services',
    'service_professionals',
    'clients',
    'client_tags',
    'appointments',
    'conversation_threads',
    'messages',
    'notification_logs',
    'message_templates'
  ]
  loop
    execute format(
      'create policy %I on public.%I for insert with check (private.has_org_role(organization_id, array[''owner'',''admin'',''manager'',''staff'',''professional'']));',
      table_name || '_insert',
      table_name
    );
    execute format(
      'create policy %I on public.%I for update using (private.has_org_role(organization_id, array[''owner'',''admin'',''manager'',''staff'',''professional''])) with check (private.has_org_role(organization_id, array[''owner'',''admin'',''manager'',''staff'',''professional'']));',
      table_name || '_update',
      table_name
    );
    execute format(
      'create policy %I on public.%I for delete using (private.has_org_role(organization_id, array[''owner'',''admin'',''manager'',''staff'',''professional'']));',
      table_name || '_delete',
      table_name
    );
  end loop;

  foreach table_name in array array[
    'organization_users',
    'appointment_status_history',
    'payments',
    'refunds',
    'wallet_credits',
    'automation_runs',
    'metrics_daily',
    'agent_configs'
  ]
  loop
    execute format(
      'create policy %I on public.%I for insert with check (private.has_org_role(organization_id, array[''owner'',''admin'',''manager'']));',
      table_name || '_insert',
      table_name
    );
    execute format(
      'create policy %I on public.%I for update using (private.has_org_role(organization_id, array[''owner'',''admin'',''manager''])) with check (private.has_org_role(organization_id, array[''owner'',''admin'',''manager'']));',
      table_name || '_update',
      table_name
    );
    execute format(
      'create policy %I on public.%I for delete using (private.has_org_role(organization_id, array[''owner'',''admin'',''manager'']));',
      table_name || '_delete',
      table_name
    );
  end loop;
end
$$;
