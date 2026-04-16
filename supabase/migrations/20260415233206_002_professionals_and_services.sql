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
