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
