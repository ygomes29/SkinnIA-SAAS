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
