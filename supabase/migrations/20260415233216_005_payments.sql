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
