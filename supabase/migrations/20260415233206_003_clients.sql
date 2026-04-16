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
