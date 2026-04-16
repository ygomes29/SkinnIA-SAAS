insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
values (
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'owner@skinnia.local',
  crypt('SkinnIA123!', gen_salt('bf')),
  timezone('utc', now()),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Owner SkinnIA"}',
  timezone('utc', now()),
  timezone('utc', now()),
  '',
  '',
  '',
  ''
)
on conflict (id) do nothing;

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  created_at,
  updated_at
)
values (
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"owner@skinnia.local"}',
  'email',
  'owner@skinnia.local',
  timezone('utc', now()),
  timezone('utc', now())
)
on conflict (id) do nothing;

insert into public.organizations (
  id,
  name,
  slug,
  plan,
  whatsapp_instance,
  whatsapp_status,
  timezone,
  settings,
  trial_ends_at
)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Studio Lumi',
  'studio-lumi',
  'pro',
  'skinnia-studio-lumi',
  'connected',
  'America/Sao_Paulo',
  '{"city":"Belo Horizonte","org_type":"studio","agent_name":"Luna","tone":"premium"}',
  null
)
on conflict (id) do nothing;

insert into public.units (
  id,
  organization_id,
  name,
  address,
  city,
  state,
  phone,
  working_hours
)
values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Matriz Savassi',
  'Rua dos Inconfidentes, 321',
  'Belo Horizonte',
  'MG',
  '+55 31 99999-1111',
  '{"monday":{"start":"09:00","end":"19:00"},"tuesday":{"start":"09:00","end":"19:00"},"wednesday":{"start":"09:00","end":"19:00"},"thursday":{"start":"09:00","end":"19:00"},"friday":{"start":"09:00","end":"19:00"},"saturday":{"start":"09:00","end":"15:00"}}'
)
on conflict (id) do nothing;

insert into public.organization_users (
  id,
  organization_id,
  user_id,
  unit_id,
  role
)
values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'owner'
)
on conflict (organization_id, user_id) do nothing;

insert into public.professionals (
  id,
  organization_id,
  unit_id,
  name,
  phone,
  commission_pct,
  working_hours
)
values
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Ana',
    '+55 31 98888-1001',
    12,
    '{"monday":{"start":"09:00","end":"18:00"},"tuesday":{"start":"09:00","end":"18:00"},"wednesday":{"start":"09:00","end":"18:00"},"thursday":{"start":"09:00","end":"18:00"},"friday":{"start":"09:00","end":"18:00"}}'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Carla',
    '+55 31 98888-1002',
    15,
    '{"monday":{"start":"10:00","end":"19:00"},"tuesday":{"start":"10:00","end":"19:00"},"wednesday":{"start":"10:00","end":"19:00"},"thursday":{"start":"10:00","end":"19:00"},"friday":{"start":"10:00","end":"19:00"},"saturday":{"start":"09:00","end":"14:00"}}'
  )
on conflict (id) do nothing;

insert into public.services (
  id,
  organization_id,
  name,
  category,
  duration_minutes,
  price,
  deposit_required,
  deposit_amount,
  color
)
values
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Lash Lifting',
    'lash',
    90,
    180,
    true,
    50,
    '#EC4899'
  ),
  (
    '99999999-9999-9999-9999-999999999999',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Hidratação Premium',
    'cabelo',
    60,
    140,
    false,
    null,
    '#8B5CF6'
  )
on conflict (id) do nothing;

insert into public.service_professionals (
  organization_id,
  service_id,
  professional_id
)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999', 'dddddddd-dddd-dddd-dddd-dddddddddddd')
on conflict (service_id, professional_id) do nothing;

insert into public.clients (
  id,
  organization_id,
  name,
  phone,
  tags,
  preferred_professional_id,
  last_appointment_at,
  total_appointments,
  total_spent,
  ltv,
  status
)
values
  (
    '12121212-1212-1212-1212-121212121212',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Marina Souza',
    '+55 31 98888-1111',
    array['vip', 'lash'],
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    timezone('utc', now()) - interval '31 days',
    8,
    1240,
    1240,
    'active'
  ),
  (
    '13131313-1313-1313-1313-131313131313',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Bianca Araujo',
    '+55 31 97777-2222',
    array['cabelo'],
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    timezone('utc', now()) - interval '14 days',
    3,
    420,
    420,
    'active'
  )
on conflict (organization_id, phone_normalized) do nothing;

insert into public.client_tags (organization_id, name, color)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'vip', '#EC4899'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'lash', '#8B5CF6'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cabelo', '#14B8A6')
on conflict (organization_id, name) do nothing;

insert into public.appointments (
  id,
  organization_id,
  unit_id,
  professional_id,
  client_id,
  service_id,
  start_at,
  end_at,
  status,
  price,
  deposit_required,
  deposit_amount,
  payment_status,
  confirmation_status,
  source
)
values
  (
    '14141414-1414-1414-1414-141414141414',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '12121212-1212-1212-1212-121212121212',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    date_trunc('hour', timezone('utc', now()) + interval '3 hours'),
    date_trunc('hour', timezone('utc', now()) + interval '4 hours 30 minutes'),
    'confirmed',
    180,
    true,
    50,
    'paid',
    'confirmed',
    'whatsapp'
  ),
  (
    '15151515-1515-1515-1515-151515151515',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '13131313-1313-1313-1313-131313131313',
    '99999999-9999-9999-9999-999999999999',
    date_trunc('hour', timezone('utc', now()) + interval '5 hours'),
    date_trunc('hour', timezone('utc', now()) + interval '6 hours'),
    'pending_payment',
    140,
    false,
    null,
    'pending',
    'pending',
    'panel'
  )
on conflict (id) do nothing;

insert into public.payments (
  id,
  organization_id,
  appointment_id,
  client_id,
  amount,
  type,
  method,
  status,
  provider,
  provider_payment_id,
  provider_payment_intent,
  paid_at
)
values
  (
    '16161616-1616-1616-1616-161616161616',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '14141414-1414-1414-1414-141414141414',
    '12121212-1212-1212-1212-121212121212',
    50,
    'deposit',
    'pix',
    'paid',
    'mercadopago',
    'mp-payment-1',
    'mp-intent-1',
    timezone('utc', now()) - interval '2 hours'
  )
on conflict (id) do nothing;

insert into public.conversation_threads (
  id,
  organization_id,
  client_id,
  phone,
  status,
  current_agent,
  context,
  last_message_at
)
values (
  '17171717-1717-1717-1717-171717171717',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '12121212-1212-1212-1212-121212121212',
  '+55 31 98888-1111',
  'bot',
  'agendamento',
  '{"last_intent":"schedule"}',
  timezone('utc', now()) - interval '15 minutes'
)
on conflict (organization_id, phone_normalized, channel) do nothing;

insert into public.messages (
  id,
  thread_id,
  organization_id,
  direction,
  content,
  message_type,
  agent
)
values
  (
    '18181818-1818-1818-1818-181818181818',
    '17171717-1717-1717-1717-171717171717',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'inbound',
    'quero agendar lash para sexta',
    'text',
    'router'
  ),
  (
    '19191919-1919-1919-1919-191919191919',
    '17171717-1717-1717-1717-171717171717',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'outbound',
    'Encontrei horários disponíveis com a Ana. Responda 1, 2 ou 3.',
    'text',
    'agendamento'
  )
on conflict (id) do nothing;

insert into public.automation_runs (
  organization_id,
  workflow_name,
  trigger_type,
  status,
  duration_ms
)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SkinnIA — Roteador Central', 'webhook', 'success', 420),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SkinnIA — Cobrança de Sinal', 'internal', 'running', 3200);

insert into public.notification_logs (
  organization_id,
  client_id,
  appointment_id,
  type,
  status,
  content
)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '12121212-1212-1212-1212-121212121212',
  '14141414-1414-1414-1414-141414141414',
  'reminder_24h',
  'sent',
  'Oi Marina! Passando para confirmar seu horário amanhã.'
);

insert into public.metrics_daily (
  organization_id,
  unit_id,
  date,
  appointments_total,
  appointments_confirmed,
  appointments_cancelled,
  appointments_no_show,
  appointments_completed,
  revenue_total,
  revenue_deposits,
  revenue_lost_no_show,
  new_clients,
  returning_clients
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    current_date - 1,
    15,
    12,
    1,
    0,
    11,
    2540,
    270,
    0,
    2,
    10
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    current_date,
    13,
    10,
    1,
    1,
    7,
    2210,
    240,
    180,
    2,
    8
  )
on conflict (organization_id, unit_id, date) do update set
  appointments_total = excluded.appointments_total,
  appointments_confirmed = excluded.appointments_confirmed,
  appointments_cancelled = excluded.appointments_cancelled,
  appointments_no_show = excluded.appointments_no_show,
  appointments_completed = excluded.appointments_completed,
  revenue_total = excluded.revenue_total,
  revenue_deposits = excluded.revenue_deposits,
  revenue_lost_no_show = excluded.revenue_lost_no_show,
  new_clients = excluded.new_clients,
  returning_clients = excluded.returning_clients;

insert into public.agent_configs (
  organization_id,
  agent_key,
  name,
  tone,
  is_active,
  prompt_overrides
)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'atendimento', 'Luna', 'premium', true, '{"handoff":"human"}'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'financeiro', 'Luna Financeiro', 'objetivo', true, '{}')
on conflict (organization_id, agent_key) do nothing;

insert into public.message_templates (
  organization_id,
  key,
  title,
  body,
  variables
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'reminder_24h',
    'Lembrete 24h',
    'Oi {nome}! Passando para lembrar do seu atendimento de {servico} amanhã às {hora}.',
    array['nome', 'servico', 'hora']
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'pix_deposit',
    'Cobrança de sinal',
    'Seu horário foi pré-reservado. Pague o sinal de {valor} via Pix para confirmar.',
    array['valor']
  )
on conflict (organization_id, key) do nothing;
