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
