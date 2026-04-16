# SkinnIA — Blueprint Técnico Completo para Claude Code

> Plataforma SaaS de automação para negócios de beleza: clínicas, salões, barbearias, lash, nail e studios de estética.
> Stack: Supabase · n8n · Evolution API (WhatsApp) · Next.js 14 · Stripe/Mercado Pago

---

## 0. PROMPT MESTRE — Cole isso no Claude Code para iniciar

```
Você é um engenheiro sênior full-stack especializado em SaaS B2B no Brasil.
Vamos construir a SkinnIA: uma plataforma multi-tenant de automação para negócios de beleza.

Stack obrigatória:
- Next.js 14 (App Router, TypeScript)
- Supabase (banco, auth, realtime, edge functions)
- n8n (self-hosted, orquestração de workflows)
- Evolution API (WhatsApp via Baileys)
- Stripe ou Mercado Pago (cobranças, Pix, sinal)
- Tailwind CSS + shadcn/ui (painel administrativo)

Regras de arquitetura:
1. Multi-tenant desde a raiz: todo registro leva organization_id
2. Row Level Security ativado em todas as tabelas
3. Webhooks são a fonte da verdade — nunca polling
4. Estados de appointment são máquina de estados rígida
5. Toda mensagem de WhatsApp passa pelo roteador central do n8n
6. Edge Functions do Supabase para lógica crítica (webhook de pagamento, RLS helpers)

Siga a ordem: banco → auth → API routes → workflows n8n → frontend → edge functions.
```

---

## 1. ARQUITETURA GERAL

```
┌─────────────────────────────────────────────────────────────────┐
│                        SKINNIA PLATFORM                         │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│   FRONTEND   │   BACKEND    │ ORQUESTRADOR │    MENSAGERIA      │
│  Next.js 14  │  Supabase    │     n8n      │  Evolution API     │
│  App Router  │  Postgres    │  Workflows   │  WhatsApp/Baileys  │
│  shadcn/ui   │  Auth + RLS  │  7 fluxos    │  Multi-instância   │
│  Tailwind    │  Realtime    │  Webhooks    │                    │
│  Recharts    │  Storage     │  Schedules   │                    │
├──────────────┴──────────────┴──────────────┴────────────────────┤
│                     INTEGRAÇÕES EXTERNAS                        │
│  Mercado Pago / Stripe · Google Calendar · Anthropic Claude API │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. BANCO DE DADOS — Supabase (PostgreSQL)

### PROMPT para Claude Code — Criar Migrations

```
Crie todas as migrations do Supabase para a SkinnIA na ordem abaixo.
Ative Row Level Security em todas as tabelas.
Use UUID como PK padrão (gen_random_uuid()).
Todos os timestamps em UTC com timezone.
Prefixe cada migration com número sequencial: 001_, 002_, etc.
```

### Migration 001 — Organizações e Unidades

```sql
-- organizations (tenant raiz)
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  plan text not null default 'trial' check (plan in ('trial','starter','pro','enterprise')),
  whatsapp_instance text,
  whatsapp_status text default 'disconnected',
  timezone text default 'America/Sao_Paulo',
  settings jsonb default '{}',
  trial_ends_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- units (filiais de uma organização)
create table units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  address text,
  city text,
  state text,
  phone text,
  is_active boolean default true,
  working_hours jsonb default '{}',
  settings jsonb default '{}',
  created_at timestamptz default now()
);

-- organization_users (equipe com papéis)
create table organization_users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  unit_id uuid references units(id),
  role text not null default 'staff' check (role in ('owner','admin','manager','staff','professional')),
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(organization_id, user_id)
);
```

### Migration 002 — Profissionais e Serviços

```sql
-- professionals
create table professionals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  unit_id uuid references units(id),
  user_id uuid references auth.users(id),
  name text not null,
  bio text,
  avatar_url text,
  phone text,
  commission_pct numeric(5,2) default 0,
  is_active boolean default true,
  working_hours jsonb default '{}',
  blocked_times jsonb default '[]',
  created_at timestamptz default now()
);

-- services
create table services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  description text,
  category text,
  duration_minutes integer not null default 60,
  price numeric(10,2) not null,
  deposit_required boolean default false,
  deposit_amount numeric(10,2),
  deposit_pct numeric(5,2),
  cancellation_policy_hours integer default 24,
  cancellation_penalty_pct numeric(5,2) default 100,
  is_active boolean default true,
  color text default '#6366f1',
  created_at timestamptz default now()
);

-- service_professionals (quais profissionais fazem qual serviço)
create table service_professionals (
  service_id uuid references services(id) on delete cascade,
  professional_id uuid references professionals(id) on delete cascade,
  custom_price numeric(10,2),
  custom_duration_minutes integer,
  primary key (service_id, professional_id)
);
```

### Migration 003 — Clientes

```sql
-- clients
create table clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  phone text not null,
  phone_normalized text generated always as (regexp_replace(phone, '[^0-9]', '', 'g')) stored,
  email text,
  birthdate date,
  notes text,
  tags text[] default '{}',
  preferred_professional_id uuid references professionals(id),
  last_appointment_at timestamptz,
  total_appointments integer default 0,
  total_spent numeric(10,2) default 0,
  ltv numeric(10,2) default 0,
  status text default 'active' check (status in ('active','inactive','blocked')),
  source text,
  created_at timestamptz default now(),
  unique(organization_id, phone_normalized)
);

-- client_tags
create table client_tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  color text default '#6366f1',
  unique(organization_id, name)
);
```

### Migration 004 — Agendamentos (coração do sistema)

```sql
-- appointments
create table appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  unit_id uuid references units(id),
  professional_id uuid references professionals(id) not null,
  client_id uuid references clients(id) not null,
  service_id uuid references services(id) not null,

  -- tempo
  start_at timestamptz not null,
  end_at timestamptz not null,

  -- máquina de estados
  status text not null default 'draft'
    check (status in ('draft','pending_payment','confirmed','cancelled','completed','no_show','refunded')),

  -- pagamento
  price numeric(10,2) not null,
  deposit_required boolean default false,
  deposit_amount numeric(10,2),
  payment_status text default 'pending'
    check (payment_status in ('pending','partial','paid','refunded','cancelled')),

  -- confirmação de presença
  confirmation_status text default 'pending'
    check (confirmation_status in ('pending','confirmed','declined','no_response')),
  reminder_sent_at timestamptz,
  confirmed_at timestamptz,

  -- controle
  source text default 'whatsapp'
    check (source in ('whatsapp','panel','site','link','api')),
  notes text,
  internal_notes text,
  cancelled_at timestamptz,
  cancellation_reason text,
  completed_at timestamptz,
  no_show_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- appointment_status_history
create table appointment_status_history (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) on delete cascade not null,
  from_status text,
  to_status text not null,
  changed_by uuid references auth.users(id),
  reason text,
  created_at timestamptz default now()
);

-- índices críticos
create index appointments_org_start on appointments(organization_id, start_at);
create index appointments_professional on appointments(professional_id, start_at);
create index appointments_client on appointments(client_id);
create index appointments_status on appointments(organization_id, status);
```

### Migration 005 — Pagamentos

```sql
-- payments
create table payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  appointment_id uuid references appointments(id) on delete cascade not null,
  client_id uuid references clients(id) not null,
  amount numeric(10,2) not null,
  type text not null check (type in ('deposit','balance','full','refund')),
  method text check (method in ('pix','credit_card','debit_card','cash','transfer')),
  status text not null default 'pending'
    check (status in ('pending','processing','paid','failed','refunded','cancelled')),
  provider text check (provider in ('mercadopago','stripe','manual')),
  provider_payment_id text,
  provider_payment_intent text,
  pix_qr_code text,
  pix_qr_code_base64 text,
  pix_expires_at timestamptz,
  paid_at timestamptz,
  refunded_at timestamptz,
  refund_amount numeric(10,2),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- refunds
create table refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references payments(id) not null,
  amount numeric(10,2) not null,
  reason text,
  status text default 'pending' check (status in ('pending','processing','completed','failed')),
  provider_refund_id text,
  processed_at timestamptz,
  created_at timestamptz default now()
);

-- wallet_credits (créditos por cancelamento tardio)
create table wallet_credits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  client_id uuid references clients(id) not null,
  amount numeric(10,2) not null,
  origin_payment_id uuid references payments(id),
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now()
);
```

### Migration 006 — Conversas e Mensagens

```sql
-- conversation_threads
create table conversation_threads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  client_id uuid references clients(id),
  phone text not null,
  channel text default 'whatsapp',
  status text default 'open' check (status in ('open','resolved','bot','human')),
  current_agent text,
  context jsonb default '{}',
  last_message_at timestamptz,
  created_at timestamptz default now()
);

-- messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references conversation_threads(id) on delete cascade not null,
  organization_id uuid references organizations(id) not null,
  direction text not null check (direction in ('inbound','outbound')),
  content text,
  media_url text,
  media_type text,
  message_type text default 'text',
  whatsapp_message_id text,
  agent text,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index messages_thread on messages(thread_id, created_at);
create index messages_org on messages(organization_id, created_at desc);
```

### Migration 007 — Automações e Métricas

```sql
-- automation_runs
create table automation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  workflow_name text not null,
  trigger_type text,
  related_id uuid,
  status text default 'running' check (status in ('running','success','error','skipped')),
  input jsonb,
  output jsonb,
  error text,
  duration_ms integer,
  created_at timestamptz default now()
);

-- notification_logs
create table notification_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  client_id uuid references clients(id),
  appointment_id uuid references appointments(id),
  type text not null,
  channel text default 'whatsapp',
  status text default 'sent' check (status in ('sent','delivered','read','failed')),
  content text,
  created_at timestamptz default now()
);

-- metrics_daily (agregação diária para dashboard)
create table metrics_daily (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  unit_id uuid references units(id),
  date date not null,
  appointments_total integer default 0,
  appointments_confirmed integer default 0,
  appointments_cancelled integer default 0,
  appointments_no_show integer default 0,
  appointments_completed integer default 0,
  revenue_total numeric(10,2) default 0,
  revenue_deposits numeric(10,2) default 0,
  revenue_lost_no_show numeric(10,2) default 0,
  new_clients integer default 0,
  returning_clients integer default 0,
  unique(organization_id, unit_id, date)
);
```

### Migration 008 — RLS (Row Level Security)

```sql
-- Habilitar RLS em todas as tabelas
alter table organizations enable row level security;
alter table units enable row level security;
alter table organization_users enable row level security;
alter table professionals enable row level security;
alter table services enable row level security;
alter table service_professionals enable row level security;
alter table clients enable row level security;
alter table appointments enable row level security;
alter table payments enable row level security;
alter table messages enable row level security;
alter table conversation_threads enable row level security;
alter table metrics_daily enable row level security;

-- Função helper: retorna organization_id do usuário autenticado
create or replace function get_user_org_id()
returns uuid as $$
  select organization_id from organization_users
  where user_id = auth.uid() and is_active = true
  limit 1;
$$ language sql security definer stable;

-- Política padrão: usuário só vê dados da própria organização
create policy "org_isolation" on organizations
  for all using (id = get_user_org_id());

create policy "org_isolation" on appointments
  for all using (organization_id = get_user_org_id());

create policy "org_isolation" on clients
  for all using (organization_id = get_user_org_id());

create policy "org_isolation" on payments
  for all using (organization_id = get_user_org_id());

-- (repetir padrão para todas as tabelas)
```

---

## 3. EDGE FUNCTIONS — Supabase

### Edge Function 1 — `webhook-payment`

```
PROMPT para Claude Code:

Crie a Edge Function `webhook-payment` no Supabase.

Ela deve:
1. Receber POST do Mercado Pago ou Stripe
2. Validar assinatura do webhook (header X-Signature)
3. Identificar o payment_intent no banco
4. Se status = approved/succeeded:
   a. Atualizar payments.status = 'paid', paid_at = now()
   b. Atualizar appointments.status = 'confirmed', payment_status = 'paid'
   c. Registrar em appointment_status_history
   d. Chamar n8n webhook POST /webhook/payment-confirmed com o appointment_id
5. Se status = rejected/failed:
   a. Atualizar payment tentativa como falha
   b. Chamar n8n POST /webhook/payment-failed
6. Retornar 200 OK sempre (para o provedor não retentar)

Use TypeScript. Importe Supabase client via @supabase/supabase-js.
Nunca exponha secrets no código — use Deno.env.get().
```

### Edge Function 2 — `check-availability`

```
PROMPT para Claude Code:

Crie a Edge Function `check-availability`.

Parâmetros de entrada (POST JSON):
- professional_id: uuid
- service_id: uuid
- date: string (YYYY-MM-DD)
- organization_id: uuid

Lógica:
1. Buscar working_hours do profissional para o dia da semana
2. Buscar agendamentos confirmed + pending_payment no dia
3. Buscar blocked_times do profissional
4. Calcular slots livres com base na duração do serviço
5. Retornar array de slots disponíveis: { start_at, end_at, available: boolean }

Usar intervalo de 30 minutos como mínimo de slot.
Respeitar duração do serviço (sem sobrepor agendamentos).
```

### Edge Function 3 — `setup-organization`

```
PROMPT para Claude Code:

Crie a Edge Function `setup-organization`.

Ela é chamada logo após cadastro do owner.
Deve:
1. Criar registro em organizations
2. Criar primeira unit (matriz)
3. Criar organization_users com role = 'owner'
4. Criar agente padrão de WhatsApp (linha em agent_configs)
5. Disparar webhook n8n /webhook/org-created para provisionar instância WhatsApp

Aceita POST com: { name, slug, owner_user_id, phone, city }
Retorna: { organization_id, unit_id, onboarding_url }
```

---

## 4. WORKFLOWS N8N — 7 Fluxos Completos

### PROMPT GERAL para Claude Code — Gerar Workflows n8n

```
Gere todos os workflows como JSON válido para importação no n8n.
Use nodes reais do n8n: Webhook, HTTP Request, Supabase (via HTTP),
IF, Switch, Set, Code, Schedule Trigger, Wait.
Para Supabase, use HTTP Request com header Authorization: Bearer {SERVICE_ROLE_KEY}.
Para WhatsApp, use HTTP Request para Evolution API em http://localhost:8080.
Sempre adicione node de error handler no final de cada workflow.
Salve cada workflow em arquivo separado: wf-01-router.json, wf-02-scheduling.json, etc.
```

---

### Workflow 01 — Roteador Central

**Arquivo:** `wf-01-router.json`

```
PROMPT para Claude Code:

Crie o workflow n8n "SkinnIA — Roteador Central".

Webhook trigger: POST /webhook/whatsapp-inbound
Payload da Evolution API:
{
  "event": "messages.upsert",
  "instance": "skinnia-xxx",
  "data": {
    "key": { "remoteJid": "5531999999999@s.whatsapp.net" },
    "message": { "conversation": "quero agendar" },
    "pushName": "Cliente Teste"
  }
}

Fluxo:
1. Extrair phone do remoteJid (remover @s.whatsapp.net)
2. Buscar tenant via GET Supabase: organizations WHERE whatsapp_instance = instance
3. Se tenant não encontrado → retornar 200 silencioso
4. Buscar ou criar client por phone + organization_id
5. Buscar ou criar conversation_thread
6. Salvar mensagem inbound em messages
7. Verificar thread.status:
   - 'human' → apenas salvar, não processar
   - 'bot' → verificar contexto e rotear para sub-workflow
8. Classificar intenção via Code node (regex simples):
   - /agendar|marcar|horário/ → trigger wf-02-scheduling
   - /cancelar|desmarcar/ → trigger wf-05-cancellation
   - /pagar|pagamento|pix/ → trigger wf-03-payment
   - /confirmar|sim|confirmado/ → trigger wf-04-reminder (resposta)
   - outro → trigger agente conversacional Claude API
9. Chamar sub-workflow via HTTP Request interno
10. Salvar resultado em automation_runs
```

---

### Workflow 02 — Agendamento

**Arquivo:** `wf-02-scheduling.json`

```
PROMPT para Claude Code:

Crie o workflow n8n "SkinnIA — Agendamento".

Trigger: HTTP Request interno (chamado pelo router) ou Webhook POST /webhook/schedule-request

Contexto recebido:
{
  "organization_id": "uuid",
  "client_id": "uuid",
  "phone": "5531...",
  "thread_id": "uuid",
  "message": "quero agendar hidratação para sexta"
}

Fluxo em 5 etapas:

ETAPA 1 — Extrair intenção via Claude API
- POST https://api.anthropic.com/v1/messages
- System: "Extraia do texto: serviço solicitado, data preferida, profissional preferido.
  Retorne JSON: { service_hint, date_hint, professional_hint }"
- Parsear resposta JSON

ETAPA 2 — Buscar serviços disponíveis
- GET Supabase: services WHERE organization_id = ? AND is_active = true
- Fazer fuzzy match entre service_hint e nomes de serviços
- Se não encontrar → perguntar ao cliente via WhatsApp

ETAPA 3 — Buscar disponibilidade
- Chamar Edge Function check-availability
- Se não há slots → oferecer próximas datas

ETAPA 4 — Confirmar com cliente
- Enviar mensagem Evolution API com opções numeradas:
  "Encontrei os seguintes horários disponíveis:
   1. Sexta 20/06 às 14h com Ana
   2. Sexta 20/06 às 16h com Carla
   3. Sábado 21/06 às 10h com Ana
   Responda com o número da opção ou 'outro' para mais opções."
- Salvar opções no context da thread (jsonb)
- Encerrar e aguardar resposta (router vai rotear próxima mensagem)

ETAPA 5 — Criar pré-reserva (chamado quando cliente responde o número)
- Criar appointment com status = 'draft'
- Verificar se serviço exige sinal:
  - SIM → chamar wf-03-payment para gerar cobrança
  - NÃO → confirmar direto (status = 'confirmed')
- Registrar em appointment_status_history
- Enviar confirmação via WhatsApp
```

---

### Workflow 03 — Cobrança de Sinal

**Arquivo:** `wf-03-payment.json`

```
PROMPT para Claude Code:

Crie o workflow n8n "SkinnIA — Cobrança de Sinal".

Trigger: HTTP Request interno POST /internal/payment-request

Body:
{
  "appointment_id": "uuid",
  "organization_id": "uuid",
  "client_id": "uuid",
  "amount": 50.00,
  "phone": "5531...",
  "service_name": "Lash Lifting",
  "professional_name": "Ana",
  "start_at": "2024-06-20T14:00:00Z"
}

Fluxo:
1. Atualizar appointment.status = 'pending_payment'
2. Gerar cobrança Pix via Mercado Pago:
   POST https://api.mercadopago.com/v1/payments
   {
     "transaction_amount": amount,
     "payment_method_id": "pix",
     "description": "Sinal — {service_name}",
     "payer": { "email": "cliente@skinnia.app" },
     "external_reference": appointment_id,
     "date_of_expiration": "now + 30 minutos"
   }
3. Salvar payment em Supabase com provider_payment_intent
4. Enviar mensagem WhatsApp via Evolution API:
   "✅ *Horário pré-reservado!*
    
    📋 *Resumo:*
    • Serviço: {service_name}
    • Profissional: {professional_name}
    • Data: {data formatada PT-BR}
    • Horário: {hora}
    • Valor total: R$ {price}
    • Sinal agora: R$ {deposit_amount}
    
    💳 *Para confirmar, pague o sinal via Pix:*
    {qr_code_base64 como imagem}
    
    ⏰ O Pix expira em *30 minutos*.
    Se não pagar, o horário será liberado automaticamente.
    
    Dúvidas? É só responder aqui 😊"
5. Agendar verificação de expiração (Wait node — 35 minutos)
6. Após wait: verificar se payment ainda está pending
   - SIM → cancelar appointment, notificar cliente, liberar horário
   - NÃO → encerrar (webhook de pagamento já tratou)
```

---

### Workflow 04 — Lembretes e Confirmação

**Arquivo:** `wf-04-reminders.json`

```
PROMPT para Claude Code:

Crie o workflow n8n "SkinnIA — Lembretes".

Trigger: Schedule — a cada 10 minutos (cron: */10 * * * *)

Fluxo PARTE A — Lembrete 24h antes:
1. Buscar Supabase: appointments WHERE
   - status = 'confirmed'
   - reminder_sent_at IS NULL
   - start_at BETWEEN now() + interval '23 hours' AND now() + interval '25 hours'
2. Para cada agendamento:
   - Enviar WhatsApp:
     "Oi {nome}! 👋
      Lembrando do seu agendamento *amanhã*:
      
      💅 {service_name}
      👩 Com {professional_name}
      📅 {data} às {hora}
      📍 {unit_address}
      
      Por favor confirme sua presença:
      *1* - Confirmo ✅
      *2* - Preciso remarcar 📅
      *3* - Preciso cancelar ❌"
   - Atualizar reminder_sent_at = now()
   - Salvar em notification_logs

Fluxo PARTE B — Lembrete 2h antes:
1. Buscar agendamentos com start_at entre now+1h50m e now+2h10m
2. Confirmation_status = 'pending' (não respondeu ao lembrete 24h)
3. Enviar lembrete urgente:
   "⏰ {nome}, seu horário é *hoje em 2 horas*!
    {service_name} às {hora} com {professional_name}
    
    Confirma? Responda *1* para sim ou *2* para remarcar."
4. Salvar log

Fluxo PARTE C — Processar respostas de confirmação:
Trigger: Webhook POST /webhook/confirmation-response
Body: { thread_id, message, phone, organization_id }

1. Buscar appointment confirmed mais próximo do cliente
2. Se mensagem = '1' → atualizar confirmation_status = 'confirmed'
   - Responder: "Perfeito! Te esperamos às {hora}. 😊"
3. Se mensagem = '2' → iniciar fluxo de remarcação (chamar wf-02)
4. Se mensagem = '3' → iniciar fluxo de cancelamento (chamar wf-05)
5. Se não responde até 1h antes → notificar profissional no WhatsApp/painel
```

---

### Workflow 05 — Cancelamento, Estorno e Multa

**Arquivo:** `wf-05-cancellation.json`

```
PROMPT para Claude Code:

Crie o workflow n8n "SkinnIA — Cancelamento".

Trigger: Webhook POST /webhook/cancellation-request
Body: { appointment_id, organization_id, requested_by, reason }

Fluxo:
1. Buscar appointment + service (para pegar cancellation_policy_hours e penalty_pct)
2. Buscar payments pagos deste appointment
3. Calcular tempo até o atendimento:
   hours_until = (start_at - now()) / 3600

4. Decidir política:
   - hours_until >= cancellation_policy_hours:
     → ESTORNO TOTAL (penalty = 0%)
   - hours_until >= cancellation_policy_hours / 2:
     → CRÉDITO EM CARTEIRA (não devolve dinheiro, gera wallet_credit)
   - hours_until < cancellation_policy_hours / 2:
     → RETENÇÃO TOTAL (penalty = cancellation_penalty_pct)

5. Executar ação financeira:
   ESTORNO TOTAL:
   - POST Mercado Pago /v1/payments/{id}/refunds amount = total
   - Criar refund no banco
   - Atualizar payment.status = 'refunded'
   
   CRÉDITO:
   - Criar wallet_credit
   - NÃO chamar API de estorno
   
   RETENÇÃO:
   - Apenas registrar, não devolver nada
   - Registrar motivo e penalty aplicada

6. Atualizar appointment.status = 'cancelled', cancelled_at = now()
7. Liberar horário (slot volta a ficar disponível)
8. Notificar cliente:
   ESTORNO: "Cancelamento confirmado. Seu reembolso de R$ {valor} será processado em até 5 dias úteis."
   CRÉDITO: "Cancelamento confirmado. Geramos um crédito de R$ {valor} para usar em próximo agendamento."
   RETENÇÃO: "Cancelamento confirmado. De acordo com nossa política, o sinal de R$ {valor} não é reembolsável para cancelamentos com menos de {X}h de antecedência."
9. Notificar profissional
10. Salvar em appointment_status_history e automation_runs
```

---

### Workflow 06 — Reativação de Clientes

**Arquivo:** `wf-06-reactivation.json`

```
PROMPT para Claude Code:

Crie o workflow n8n "SkinnIA — Reativação de Inativos".

Trigger: Schedule — diário às 10h (cron: 0 10 * * *)

Fluxo:
1. Buscar todas as organizations ativas (plan != 'trial' expirado)
2. Para cada org, buscar clientes:
   - last_appointment_at < now() - interval '30 days'
   - status = 'active'
   - Ainda não receberam campanha nos últimos 15 dias (checar notification_logs)
3. Segmentar por dias de inatividade:
   - 30 dias → mensagem suave ("sentimos sua falta")
   - 45 dias → mensagem com benefício
   - 60 dias → mensagem com urgência/oferta
   - 90+ dias → última tentativa com desconto

4. Para cada cliente, gerar mensagem personalizada via Claude API:
   System: "Você é a assistente virtual de {org_name}, um negócio de beleza.
   Escreva uma mensagem curta e calorosa de WhatsApp para reativar o cliente.
   Cliente: {name}. Último serviço: {last_service}. Profissional preferida: {professional}.
   Dias inativo: {days}. Tom: {tom baseado nos dias}.
   Máximo 4 linhas. Inclua sugestão de horário fictício para criar senso de urgência.
   NÃO use linguagem corporativa. Seja natural e próxima."

5. Enviar mensagem via Evolution API
6. Salvar em notification_logs
7. Registrar em automation_runs com contagem de disparos

Exemplo de mensagem gerada:
"Oi {nome}! 🌸 Já faz um tempinho que não te vemos por aqui.
Temos horário disponível essa semana com a {professional}.
Que tal renovar o {last_service}? 💅
Responde aqui que a gente te ajuda a agendar!"
```

---

### Workflow 07 — Pós-Atendimento e Rebooking

**Arquivo:** `wf-07-post-service.json`

```
PROMPT para Claude Code:

Crie o workflow n8n "SkinnIA — Pós-Atendimento".

Trigger: Webhook POST /webhook/appointment-completed
Body: { appointment_id, organization_id }

Também: Schedule a cada 30min buscando appointments com
completed_at BETWEEN now() - interval '35 minutes' AND now() - interval '25 minutes'
que ainda não tiveram pós-atendimento.

Fluxo — 3 horas após o atendimento:
1. Aguardar 3h (Wait node)
2. Buscar dados completos do appointment, client, professional, service

MENSAGEM 1 — Agradecimento e NPS:
"Oi {nome}! Como foi seu {service_name} com a {professional}? 🌟
 Gostaríamos muito da sua opinião!
 De 0 a 10, quanto você recomendaria nosso atendimento?
 (Responda só com o número)"

3. Registrar resposta no cliente (nps_score)
4. Aguardar 30 min

MENSAGEM 2 — Review:
NPS >= 9: "Que ótimo! Sua opinião é muito importante. 💛
  Você pode nos deixar uma avaliação no Google? Ajuda muito!
  {link_google_review}"
NPS < 7: "Sentimos muito por não ter sido perfeito. 😔
  Pode me contar o que aconteceu? Quero resolver isso pra você."

MENSAGEM 3 — Rebooking (24h após):
Buscar frequência média do cliente naquele serviço:
- Se serviço tem ciclo (lash = 21 dias, nail = 15 dias, cabelo = 30 dias):
  "Ei {nome}! Já pensando na sua próxima {service_name}? 😊
   Aqui vai um lembrete: o ideal é retornar em cerca de {dias} dias.
   Quer que eu já reserve com {professional} para {data sugerida}?
   Responda *SIM* e eu cuido do resto! 🗓️"

5. Se cliente responde SIM → chamar wf-02-scheduling com contexto pré-preenchido
6. Atualizar client.total_appointments + 1, total_spent, last_appointment_at
7. Recalcular LTV do cliente
8. Registrar automation_run
```

---

## 5. FRONTEND — Next.js 14

### PROMPT MESTRE para Claude Code — Painel Admin

```
Crie o painel administrativo da SkinnIA com Next.js 14 App Router e TypeScript.

Design system:
- shadcn/ui + Tailwind CSS
- Tema: escuro com acentos em rosa (#EC4899) e roxo (#8B5CF6)
- Fonte: Geist Sans
- Sidebar fixa, conteúdo com scroll

Estrutura de pastas:
app/
  (auth)/
    login/page.tsx
    register/page.tsx
  (dashboard)/
    layout.tsx (sidebar + header)
    page.tsx (dashboard principal)
    agenda/page.tsx
    clientes/page.tsx
    financeiro/page.tsx
    equipe/page.tsx
    automacao/page.tsx
    configuracoes/page.tsx

components/
  ui/ (shadcn)
  layout/sidebar.tsx
  layout/header.tsx
  agenda/calendar-view.tsx
  agenda/appointment-card.tsx
  clientes/client-table.tsx
  financeiro/revenue-chart.tsx
  dashboard/metrics-cards.tsx
  dashboard/upcoming-appointments.tsx

lib/
  supabase/client.ts
  supabase/server.ts
  supabase/middleware.ts
  hooks/use-appointments.ts
  hooks/use-clients.ts
  hooks/use-metrics.ts
  utils/date.ts (formatação pt-BR)
  utils/currency.ts (formatação BRL)
```

### PROMPT — Dashboard Principal

```
Crie o componente da página principal do dashboard (app/(dashboard)/page.tsx).

Deve exibir:
1. Cards de métricas do dia (Server Component com Suspense):
   - Agendamentos do dia (total / confirmados / pendentes)
   - Receita do dia (R$ formatado)
   - No-shows do dia
   - Taxa de confirmação (%)
   Buscar de metrics_daily WHERE date = today

2. Agenda de hoje (Client Component com realtime):
   - Lista de agendamentos ordenados por horário
   - Badge de status colorido por tipo
   - Foto + nome do profissional
   - Nome do cliente
   - Serviço e horário
   - Ação rápida: marcar como concluído / no-show
   Supabase Realtime para atualizar em tempo real

3. Gráfico de receita (últimos 7 dias):
   - Recharts BarChart
   - Dados de metrics_daily

4. Clientes retornando esta semana:
   - Lista de clientes com last_appointment_at há 25-35 dias
   - Botão "Enviar lembrete" → dispara wf-06

Layout: grid 2 colunas no desktop, 1 coluna no mobile.
Todos os textos em pt-BR. Datas formatadas com date-fns/pt.
```

### PROMPT — Página de Agenda

```
Crie a página de agenda (app/(dashboard)/agenda/page.tsx).

Funcionalidades:
1. Visualização semanal (padrão) e diária
2. Filtro por profissional (dropdown com avatares)
3. Cada agendamento como card colorido pelo serviço
4. Drag-and-drop para remarcar (usando @dnd-kit/core)
5. Click no horário vazio → modal de novo agendamento
6. Click no agendamento → modal de detalhes com ações:
   - Confirmar manualmente
   - Marcar como concluído
   - Marcar como no-show
   - Cancelar
   - Enviar lembrete agora
   - Ver conversa do WhatsApp

Modal de novo agendamento:
- Select de cliente (com busca por nome/phone)
- Select de serviço
- Select de profissional (filtrado pelo serviço)
- DatePicker + TimePicker (apenas slots disponíveis)
- Preview do resumo antes de confirmar
- Opção de cobrar sinal ou confirmar direto

Use Supabase Realtime para atualizar agenda em tempo real.
```

### PROMPT — Página de Clientes

```
Crie a página de clientes (app/(dashboard)/clientes/page.tsx).

Tabela com:
- Nome + avatar inicial
- Telefone (formatado)
- Total de agendamentos
- LTV (R$)
- Último atendimento (data relativa: "há 3 dias")
- Status (ativo/inativo)
- Tags coloridas
- Ação: Ver perfil, Enviar mensagem

Perfil do cliente (sheet lateral):
- Histórico completo de agendamentos
- Serviços mais frequentes
- Profissional favorita
- Gráfico de frequência mensal
- Créditos em carteira
- Histórico de conversas resumido
- Botão "Agendar agora"
- Botão "Enviar campanha de retorno"

Busca por nome ou telefone (debounce 300ms).
Filtro por status, tag, profissional.
Export CSV dos clientes filtrados.
```

### PROMPT — Página de Automação

```
Crie a página de automação (app/(dashboard)/automacao/page.tsx).

Seções:
1. Status dos Agentes
   - Card para cada agente (Atendimento, Agendamento, Confirmação, Reativação, Pós-Atendimento, Financeiro)
   - Toggle ativo/inativo por agente
   - Última execução + status (verde/vermelho)
   - Quantidade de interações hoje

2. Logs de Automação
   - Tabela de automation_runs
   - Colunas: workflow, trigger, status, duração, quando
   - Click para ver input/output JSON
   - Filtro por status (sucesso/erro)

3. Configurações de Templates
   - Editor de mensagem por tipo de automação
   - Preview em "bolha de WhatsApp"
   - Variáveis disponíveis listadas: {nome}, {servico}, {data}, etc.

4. Políticas de Cancelamento
   - Por serviço ou global
   - Configurar horas mínimas e percentual de retenção
```

---

## 6. INTEGRAÇÃO WHATSAPP — Evolution API

### PROMPT para Claude Code — Setup Evolution API

```
Crie o arquivo docker-compose.yml para subir Evolution API self-hosted.

Serviços:
- evolution-api (imagem: atendai/evolution-api:latest)
- redis (para filas)
- Variáveis de ambiente necessárias

Após subir, crie o helper lib/evolution.ts com funções:
- sendText(instance, phone, text)
- sendImage(instance, phone, imageUrl, caption)
- sendDocument(instance, phone, documentUrl, fileName)
- sendReaction(instance, phone, messageId, emoji)
- getQRCode(instance) → para parear WhatsApp
- createInstance(instanceName, webhookUrl) → ao criar nova organização

A URL base da Evolution API vem de EVOLUTION_API_URL env.
O API Key vem de EVOLUTION_API_KEY env.
Todas as funções retornam { success: boolean, data?, error? }.
```

---

## 7. AGENTE CONVERSACIONAL — Claude API

### PROMPT para Claude Code — Agente SkinnIA

```
Crie o arquivo lib/agents/skinnia-agent.ts

Este agente é chamado pelo n8n quando uma mensagem não se encaixa em fluxo específico.

Função principal:
async function processMessage(context: AgentContext): Promise<AgentResponse>

Tipo AgentContext:
{
  organization: Organization
  client: Client | null
  thread: ConversationThread
  message: string
  history: Message[] // últimas 10 mensagens
  available_actions: string[] // ['schedule', 'cancel', 'info', 'payment']
}

System prompt do agente:
"Você é {agent_name}, assistente virtual de {org_name}.
Negócio: {org_type} (salão/clínica/barbearia/lash/nail).
Localização: {city}.
Serviços disponíveis: {services_list}.
Profissionais: {professionals_list}.
Horários de funcionamento: {working_hours}.

Sua personalidade: {tone} (amigável, profissional, jovem, premium — configurável).

Regras:
- Responda SEMPRE em português brasileiro informal
- Máximo 3 parágrafos por resposta
- Se o cliente quer agendar → colete: serviço, data/hora preferida, profissional (opcional)
- Nunca invente horários disponíveis — sempre diga que vai verificar
- Se não souber responder → ofereça falar com atendente humano
- Nunca mencione que é uma IA a menos que perguntado diretamente

Quando precisar de ação do sistema, retorne JSON no final da resposta:
<action>{ \"type\": \"schedule\", \"service_hint\": \"...\", \"date_hint\": \"...\" }</action>"

A função deve:
1. Montar o contexto completo
2. Chamar Anthropic API com histórico da conversa
3. Parsear possível <action> da resposta
4. Retornar { message: string, action?: ActionPayload }
5. O n8n processa o action e chama o workflow correto
```

---

## 8. VARIÁVEIS DE AMBIENTE

```
PROMPT para Claude Code:

Crie o arquivo .env.example completo para o projeto SkinnIA:

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# n8n
N8N_BASE_URL=http://localhost:5678
N8N_WEBHOOK_BASE=http://localhost:5678/webhook
N8N_API_KEY=

# Evolution API (WhatsApp)
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=

# Stripe (alternativa)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Anthropic (agente conversacional)
ANTHROPIC_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=SkinnIA
```

---

## 9. ORDEM DE CONSTRUÇÃO COM CLAUDE CODE

```
SESSÃO 1 — Banco de dados (1-2h)
prompt: "Crie todas as migrations do Supabase conforme blueprint SkinnIA.
Comece pela 001_organizations. Execute cada migration e confirme sucesso antes da próxima.
Ative RLS em todas. Crie a função get_user_org_id()."

SESSÃO 2 — Auth e setup (1h)
prompt: "Configure Supabase Auth com email+password.
Crie middleware Next.js para proteção de rotas.
Crie a Edge Function setup-organization."

SESSÃO 3 — Workflows n8n base (2-3h)
prompt: "Crie os workflows wf-01-router e wf-02-scheduling no n8n.
Teste com payload de exemplo da Evolution API.
Use environment variables para todas as URLs e keys."

SESSÃO 4 — Pagamentos (1-2h)
prompt: "Crie wf-03-payment com integração Mercado Pago.
Crie a Edge Function webhook-payment.
Teste fluxo completo: pré-reserva → Pix → confirmação webhook → appointment confirmed."

SESSÃO 5 — Lembretes e cancelamento (1-2h)
prompt: "Crie wf-04-reminders (schedule) e wf-05-cancellation.
Implemente lógica de políticas de cancelamento com estorno/crédito/retenção."

SESSÃO 6 — Frontend dashboard (3-4h)
prompt: "Crie o painel Next.js 14 conforme blueprint.
Comece por layout, sidebar e dashboard principal.
Use shadcn/ui e tema escuro rosa/roxo da SkinnIA."

SESSÃO 7 — Agenda e clientes (2-3h)
prompt: "Crie as páginas de Agenda e Clientes.
Implemente realtime do Supabase na agenda.
Adicione modal de novo agendamento com verificação de disponibilidade."

SESSÃO 8 — Agente e pós-atendimento (1-2h)
prompt: "Crie o agente conversacional em lib/agents/skinnia-agent.ts.
Integre com o router do n8n.
Crie wf-06-reactivation e wf-07-post-service."

SESSÃO 9 — Testes e ajustes (2h)
prompt: "Simule os seguintes cenários ponta a ponta:
1. Cliente manda 'quero agendar' no WhatsApp
2. Fluxo completo até pagamento do sinal
3. Cliente cancela 2h antes
4. Lembrete automático e confirmação
5. Pós-atendimento e rebooking"
```

---

## 10. CHECKLIST DE ENTREGA

```
BANCO
[ ] 8 migrations executadas sem erro
[ ] RLS ativo em todas as tabelas
[ ] Índices criados (appointments_org_start, etc.)
[ ] Edge Functions deployadas (3)
[ ] Seed de dados de teste

N8N
[ ] 7 workflows importados e ativos
[ ] Webhook URLs apontando para Evolution API
[ ] Credenciais configuradas no n8n
[ ] Schedule triggers ativos

WHATSAPP
[ ] Evolution API rodando (Docker)
[ ] Instância criada e QR pareado
[ ] Webhook configurado → n8n router

PAGAMENTOS
[ ] Mercado Pago integrado (sandbox)
[ ] Webhook de pagamento funcionando
[ ] Fluxo Pix testado ponta a ponta

FRONTEND
[ ] Auth funcionando
[ ] Dashboard com métricas reais
[ ] Agenda com realtime
[ ] CRUD de clientes, serviços, profissionais
[ ] Configurações de organização e agentes

AGENTE
[ ] Claude API integrada
[ ] Contexto de organização injetado
[ ] Parsing de <action> funcionando
[ ] Handoff para humano implementado
```

---

*SkinnIA Blueprint v2.0 — Gerado para implementação com Claude Code*
*Stack: Next.js 14 · Supabase · n8n · Evolution API · Mercado Pago · Anthropic Claude*
