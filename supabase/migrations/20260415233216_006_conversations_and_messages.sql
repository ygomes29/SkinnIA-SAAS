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
