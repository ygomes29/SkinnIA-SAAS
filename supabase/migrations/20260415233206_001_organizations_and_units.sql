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
