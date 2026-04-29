# ═══════════════════════════════════════════════════════════════
# SKINNIA CONTROL — ROADMAP COMPLETO DE CONCLUSÃO
# Prompts executáveis para Claude Code
# Baseado no estado atual + paridade com IAFIT Control
# ═══════════════════════════════════════════════════════════════

# Contexto obrigatório antes de executar qualquer prompt:
# - Framework: Next.js (App Router)
# - Banco: Supabase (20 tabelas, RLS ativo, seed aplicado)
# - Auth: Server Actions + middleware de proteção de rotas
# - API: 13 rotas existentes em /api/
# - WhatsApp: lib/evolution.ts (helper escrito, Evolution API não pareada)
# - IA: lib/agents/ (agente escrito, sem ANTHROPIC_API_KEY no .env)
# - n8n: 7 workflows importados, todos inativos
# - Edge Functions: webhook-payment, check-availability, setup-organization (escritas, não deployadas)
# - Páginas funcionais com dados reais: Dashboard, Agenda, Clientes, Equipe,
#   Configurações, Automação, Financeiro, Onboarding
# - Páginas placeholder (sem funcionalidade real): /conversas, /integracoes, /logs, /agentes

# Regras absolutas:
# 1. Não quebrar o que já funciona.
# 2. Conferir tabelas existentes antes de criar novas (20 tabelas já estão lá).
# 3. Não hardcodar organization_id, user_id, instanceName ou API keys.
# 4. Não expor secrets no client — apenas no servidor.
# 5. Se credencial estiver ausente, criar fallback visual e checklist de ativação.
# 6. Seguir identidade visual do SkinnIA (dark/light mode com tokens CSS existentes).
# 7. Implementar fase por fase, rodar lint/typecheck/build após cada uma.


# ┌─────────────────────────────────────────────────────────────┐
# │  FASE 1 — FECHAR O QUE ESTÁ PENDENTE (Alta Prioridade)    │
# │  Estimativa: 1-2 dias                                      │
# └─────────────────────────────────────────────────────────────┘


## 1.1 — Normalizar variáveis de ambiente e criar central de status

### PROMPT CLAUDE CODE:
"""
No projeto SkinnIA, crie o arquivo `src/lib/env.ts` como central de 
variáveis de ambiente:

```typescript
// src/lib/env.ts

const SERVER_ENVS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
  'EVOLUTION_API_URL',
  'EVOLUTION_API_KEY',
  'MERCADOPAGO_ACCESS_TOKEN',
  'MERCADOPAGO_WEBHOOK_SECRET',
  'N8N_BASE_URL',
  'N8N_WEBHOOK_SECRET',
] as const;

const PUBLIC_ENVS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_APP_URL',
] as const;

export function getMissingEnvs(): string[] {
  return SERVER_ENVS.filter(key => !process.env[key]);
}

export function isEnvConfigured(key: string): boolean {
  return !!process.env[key];
}

export function getEvolutionConfig() {
  return {
    url: process.env.EVOLUTION_API_URL || '',
    apiKey: process.env.EVOLUTION_API_KEY || '',
    instanceName: process.env.EVOLUTION_INSTANCE_NAME || '',
    configured: !!(process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY),
  };
}

export function getMercadoPagoConfig() {
  return {
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
    configured: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
  };
}

export function getAnthropicConfig() {
  return {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    configured: !!process.env.ANTHROPIC_API_KEY,
  };
}
```

Depois, criar a rota de API:

`GET /api/integrations/status`

```typescript
// app/api/integrations/status/route.ts
import { isEnvConfigured } from '@/lib/env';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    supabase: {
      status: isEnvConfigured('NEXT_PUBLIC_SUPABASE_URL') ? 'connected' : 'missing_env',
    },
    evolution: {
      status: isEnvConfigured('EVOLUTION_API_KEY') ? 'configured' : 'missing_env',
      missing: ['EVOLUTION_API_URL', 'EVOLUTION_API_KEY', 'EVOLUTION_INSTANCE_NAME']
        .filter(k => !isEnvConfigured(k)),
    },
    anthropic: {
      status: isEnvConfigured('ANTHROPIC_API_KEY') ? 'configured' : 'missing_env',
      missing: isEnvConfigured('ANTHROPIC_API_KEY') ? [] : ['ANTHROPIC_API_KEY'],
    },
    mercadopago: {
      status: isEnvConfigured('MERCADOPAGO_ACCESS_TOKEN') ? 'configured' : 'missing_env',
      missing: ['MERCADOPAGO_ACCESS_TOKEN', 'MERCADOPAGO_WEBHOOK_SECRET']
        .filter(k => !isEnvConfigured(k)),
    },
    n8n: {
      status: isEnvConfigured('N8N_BASE_URL') ? 'configured' : 'not_configured',
    },
    edgeFunctions: {
      status: 'pending_deploy',
      functions: ['webhook-payment', 'check-availability', 'setup-organization'],
    },
  });
}
```

Também atualizar `.env.example` com todas as variáveis e comentários explicativos.
Não expor valores reais, apenas o template.
"""


## 1.2 — Completar `/integracoes` com status real e configuração

### PROMPT CLAUDE CODE:
"""
A página `/integracoes` existe mas está em placeholder. Transformá-la em
uma central de configuração real.

LAYOUT DA PÁGINA:

Cards de integração, um por serviço. Cada card mostra:
- Ícone + nome do serviço
- Badge de status: Conectado (verde) / Não configurado (amarelo) / Erro (vermelho)
- Variáveis ausentes listadas
- Botão "Testar conexão" (quando configurado)
- Accordion "Como configurar" com instruções

CARDS:

1. **WhatsApp / Evolution API**
   - Status vem de GET /api/integrations/status → campo evolution
   - Se configurado: mostrar instância, botão "Testar envio", botão "Ver QR Code"
   - Se não configurado: mostrar checklist:
     ```
     [ ] Subir Evolution API via Docker
     [ ] Adicionar EVOLUTION_API_URL no .env
     [ ] Adicionar EVOLUTION_API_KEY no .env
     [ ] Adicionar EVOLUTION_INSTANCE_NAME no .env
     [ ] Parear WhatsApp com QR Code
     ```

2. **Mercado Pago**
   - Status vem de GET /api/integrations/status → campo mercadopago
   - Se configurado: mostrar webhook URL (APP_URL + /api/webhooks/mercadopago)
   - Se não configurado: instruções para configurar

3. **n8n**
   - Status: configured ou not_configured
   - Se configurado: link para abrir n8n (N8N_BASE_URL)
   - Lista dos 7 workflows com status (ativo/inativo) — buscar via API n8n se disponível
   - Se não configurado: instruções

4. **Anthropic IA**
   - Status vem do campo anthropic
   - Se configurado: botão "Testar IA" que chama POST /api/integrations/anthropic/test
   - Modelo atual: claude-sonnet-4-20250514

5. **Supabase Edge Functions**
   - Sempre mostra os 3 comandos de deploy para copiar:
   ```bash
   supabase functions deploy webhook-payment
   supabase functions deploy check-availability
   supabase functions deploy setup-organization
   ```
   - Botão copiar para cada comando

Buscar status ao montar a página com SWR ou useEffect.
Seguir identidade visual do SkinnIA (tokens CSS existentes, dark/light mode).
"""


## 1.3 — Completar `/logs` como central de observabilidade

### PROMPT CLAUDE CODE:
"""
A página `/logs` existe mas está em placeholder. Verificar primeiro se já
existe tabela `automation_runs` no Supabase.

Se NÃO existir, criar migration:

```sql
-- supabase/migrations/XXX_automation_runs.sql
CREATE TABLE IF NOT EXISTS automation_runs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type                  TEXT NOT NULL, -- 'whatsapp_inbound', 'appointment_reminder', 'reactivation', 'payment_webhook', 'ai_response', 'no_show', 'confirmation'
  source                TEXT, -- 'n8n', 'edge_function', 'api', 'webhook'
  status                TEXT DEFAULT 'success', -- 'success', 'error', 'skipped'
  input                 JSONB DEFAULT '{}',
  output                JSONB DEFAULT '{}',
  error_message         TEXT,
  duration_ms           INT,
  related_client_id     UUID,
  related_appointment_id UUID,
  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_automation_runs_org ON automation_runs(organization_id, created_at DESC);
CREATE INDEX idx_automation_runs_type ON automation_runs(type, status);
CREATE INDEX idx_automation_runs_client ON automation_runs(related_client_id);

ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_automation_runs" ON automation_runs FOR ALL USING (
  organization_id = get_user_org_id()
);
```

INTERFACE DA PÁGINA:

1. **Filtros** (barra superior):
   - Data (date range picker)
   - Tipo (select: todos, whatsapp, agendamento, reativação, pagamento, IA)
   - Status (todos, sucesso, erro, pulado)

2. **Tabela de logs**:
   - Colunas: Tipo, Status (badge colorido), Data/hora, Duração (ms), Resumo
   - Click em uma linha: abrir drawer lateral

3. **Drawer de detalhe**:
   - JSON formatado do input e output (com syntax highlight)
   - Botão "Copiar JSON"
   - Link para cliente/agendamento relacionado (se existir)
   - Botão "Reprocessar" (para tipos reprocessáveis como reativação)

4. **Botão "Exportar CSV"** no header

Queries Supabase filtradas por organization_id usando get_user_org_id().
Paginação de 50 por página com infinite scroll ou paginação manual.
"""


## 1.4 — Deploy das Edge Functions (documentação executável)

### PROMPT CLAUDE CODE:
"""
Revisar as 3 Edge Functions existentes antes do deploy e criar documentação.

Para cada função, verificar:

1. **webhook-payment**:
   - Lê MERCADOPAGO_WEBHOOK_SECRET para validar assinatura
   - Se assinatura inválida, retorna 401
   - Busca detalhes do pagamento no MP
   - Atualiza tabela de pagamentos/financeiro
   - Registra em automation_runs
   - É idempotente (não processa o mesmo payment_id duas vezes)
   - Se tabela de pagamentos não existir, criar:
   ```sql
   CREATE TABLE IF NOT EXISTS payments (
     id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     organization_id       UUID NOT NULL REFERENCES organizations(id),
     client_id             UUID REFERENCES clients(id),
     appointment_id        UUID,
     provider              TEXT DEFAULT 'mercadopago',
     provider_payment_id   TEXT UNIQUE NOT NULL,
     status                TEXT, -- approved, pending, rejected, cancelled
     amount                NUMERIC NOT NULL,
     currency              TEXT DEFAULT 'BRL',
     payment_method        TEXT,
     paid_at               TIMESTAMPTZ,
     raw_payload           JSONB DEFAULT '{}',
     created_at            TIMESTAMPTZ DEFAULT now(),
     updated_at            TIMESTAMPTZ DEFAULT now()
   );
   CREATE INDEX idx_payments_org ON payments(organization_id, created_at DESC);
   CREATE INDEX idx_payments_provider ON payments(provider_payment_id);
   ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "org_payments" ON payments FOR ALL USING (
     organization_id = get_user_org_id()
   );
   ```

2. **check-availability**:
   - Recebe: professional_id, service_id, date, organization_id
   - Consulta agendamentos existentes
   - Consulta calendar_blocks (se existir)
   - Consulta horários do profissional
   - Retorna slots disponíveis como array de strings

3. **setup-organization**:
   - Cria organização, workspace, usuário admin
   - Cria agentes padrão:
     - reception (Recepção)
     - scheduling (Agendamento)
     - reactivation (Reativação)
     - confirmation (Confirmação)
     - reminder (Lembretes)
     - post_service (Pós-atendimento)
     - no_show (Recuperação no-show)
   - Se agente 'welcome' não existir, adicionar também

Criar `docs/deploy-edge-functions.md` com:
```bash
# Pré-requisitos
supabase login
supabase link --project-ref SEU_PROJECT_REF

# Deploy
supabase functions deploy webhook-payment
supabase functions deploy check-availability
supabase functions deploy setup-organization

# Variáveis de ambiente das functions
supabase secrets set ANTHROPIC_API_KEY=sua_key
supabase secrets set MERCADOPAGO_ACCESS_TOKEN=sua_key
supabase secrets set MERCADOPAGO_WEBHOOK_SECRET=seu_secret
supabase secrets set EVOLUTION_API_URL=sua_url
supabase secrets set EVOLUTION_API_KEY=sua_key
```
"""


# ┌─────────────────────────────────────────────────────────────┐
# │  FASE 2 — COMPLETAR AGENDA (Média Prioridade)              │
# │  Estimativa: 1 dia                                         │
# └─────────────────────────────────────────────────────────────┘


## 2.1 — Modal de novo agendamento ao clicar em horário vazio

### PROMPT CLAUDE CODE:
"""
Na página Agenda do SkinnIA, adicionar interação ao clicar em slot vazio.

Ao clicar em horário sem agendamento:
1. Abrir modal "Novo Agendamento" com data/hora pré-preenchida

CAMPOS DO MODAL:
- Cliente: busca ao digitar (query na tabela clients por nome/telefone)
  OU toggle "Novo cliente" que mostra campos: nome + telefone
- Serviço: select com serviços ativos da tabela services
- Profissional: select com profissionais ativos da tabela professionals
  (filtrado pelo serviço selecionado, se houver relação)
- Data: pré-preenchida pelo clique
- Hora início: pré-preenchida pelo clique
- Hora fim: calculada automaticamente pela duração do serviço selecionado
- Observações: textarea opcional
- Origem: select fixo com opções: manual, whatsapp, site, indicacao
- Status inicial: toggle Agendado / Confirmado

VALIDAÇÕES:
- Checar disponibilidade via GET /api/check-availability antes de salvar
- Se conflito de horário: mostrar toast de erro com os agendamentos conflitantes
- Não permitir horário fora do expediente (usar regras de horário do profissional se existir)
- Botão salvar desabilitado até todos os campos obrigatórios estarem preenchidos

SALVAR:
- POST /api/appointments (rota já existe)
- Body: { client_id, service_id, professional_id, start_datetime, end_datetime, 
         notes, origin, status, organization_id }
- Após salvar: fechar modal, atualizar calendário sem reload completo
- Registrar em automation_runs: { type: 'appointment_created', source: 'manual' }

Seguir padrão visual das páginas existentes do SkinnIA.
"""


## 2.2 — Modal de detalhe e ações do agendamento

### PROMPT CLAUDE CODE:
"""
Na página Agenda do SkinnIA, ao clicar em um card de agendamento existente,
abrir um drawer lateral (não modal) com os detalhes.

CONTEÚDO DO DRAWER:
- Nome do cliente, telefone (clicável para abrir WhatsApp)
- Serviço, profissional, data, hora início-fim
- Status atual (badge colorido)
- Origem (manual, whatsapp, site)
- Observações
- Data de criação

AÇÕES (botões no footer do drawer):
1. **Confirmar** — atualiza status para 'confirmed' (PUT /api/appointments/[id]/status)
2. **Compareceu** — atualiza para 'completed'
3. **No-show** — atualiza para 'no_show' e registra em automation_runs
4. **Cancelar** — abre sub-modal de confirmação, pede motivo, atualiza para 'cancelled'
5. **Remarcar** — abre mini-modal para escolher nova data/hora
6. **Enviar lembrete WhatsApp** — chama POST /api/integrations/evolution/send com
   template de lembrete. Se Evolution não configurado, mostrar aviso amigável.
7. **Abrir conversa** — navega para /conversas?phone={cliente.telefone}

Para as ações que mudam status, atualizar o card no calendário imediatamente
via mutation no estado local, sem reload da página.

Rota existente para atualizar status: PUT /api/appointments/[id] (verificar parâmetros aceitos).
Se a rota ainda não aceita 'status', adicionar esse campo ao handler.
"""


## 2.3 — Drag-and-drop para remarcar + filtro por profissional

### PROMPT CLAUDE CODE:
"""
Na página Agenda do SkinnIA, implementar drag-and-drop para remarcar.

INSTALAÇÃO:
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

IMPLEMENTAÇÃO:
1. Envolver o calendário semanal com DndContext
2. Cada card de agendamento deve ser um <Draggable>
3. Cada slot de horário deve ser um <Droppable>

AO SOLTAR UM CARD NUM NOVO SLOT:
```javascript
async function handleDrop(appointmentId, newStartDatetime) {
  // Calcular nova hora fim baseado na duração original
  const appointment = appointments.find(a => a.id === appointmentId);
  const duration = differenceInMinutes(appointment.end_datetime, appointment.start_datetime);
  const newEnd = addMinutes(newStartDatetime, duration);

  // Verificar disponibilidade
  const available = await checkAvailability({
    professional_id: appointment.professional_id,
    start: newStartDatetime,
    end: newEnd,
    exclude_appointment_id: appointmentId,
  });

  if (!available) {
    // Reverter posição do card + toast de erro
    toast.error('Horário indisponível. Escolha outro slot.');
    return;
  }

  // Atualizar no banco
  await fetch(`/api/appointments/${appointmentId}`, {
    method: 'PUT',
    body: JSON.stringify({ start_datetime: newStartDatetime, end_datetime: newEnd }),
  });
}
```

FILTRO POR PROFISSIONAL:
- Adicionar select "Todos os profissionais" no header da Agenda
- Ao selecionar um profissional, filtrar cards do calendário
- O filtro não deve fazer nova query — filtrar o array já carregado em memória
- Badge com inicial do profissional em cada card quando mostrar "todos"

Não quebrar a visualização semanal/diária existente.
"""


## 2.4 — Bloqueios de agenda

### PROMPT CLAUDE CODE:
"""
Verificar se a tabela `calendar_blocks` já existe no Supabase.
Se NÃO existir, criar via migration:

```sql
CREATE TABLE IF NOT EXISTS calendar_blocks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  professional_id  UUID REFERENCES professionals(id),
  start_datetime   TIMESTAMPTZ NOT NULL,
  end_datetime     TIMESTAMPTZ NOT NULL,
  block_type       TEXT DEFAULT 'manual', -- manual, holiday, vacation, maintenance
  title            TEXT NOT NULL,
  description      TEXT,
  all_day          BOOLEAN DEFAULT false,
  recurring        BOOLEAN DEFAULT false,
  recurrence_rule  TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_calendar_blocks_org ON calendar_blocks(organization_id, start_datetime);
CREATE INDEX idx_calendar_blocks_prof ON calendar_blocks(professional_id);
ALTER TABLE calendar_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_calendar_blocks" ON calendar_blocks FOR ALL USING (
  organization_id = get_user_org_id()
);
```

Criar página `/agenda/bloqueios` com:

1. **Header**: "Bloqueios de Agenda" + botão "Novo Bloqueio"

2. **Lista de bloqueios** em cards ou tabela:
   - Data/hora início e fim
   - Profissional (ou "Todos" se professional_id for null)
   - Tipo com badge colorido: manual=cinza, feriado=verde, férias=azul, manutenção=amarelo
   - Título
   - Botões: Editar, Excluir

3. **Modal "Novo Bloqueio"**:
   - Tipo (select)
   - Profissional (select + opção "Todos")
   - Data início + hora início
   - Data fim + hora fim
   - Título
   - Descrição (opcional)
   - Toggle "Dia inteiro" — se ativo, ocultar time pickers
   - Toggle "Recorrente" — se ativo, mostrar campo de regra

4. **Integrar com check-availability**:
   No GET /api/check-availability, incluir consulta a calendar_blocks
   para excluir slots bloqueados dos horários disponíveis

Seguir padrão visual das outras páginas de agenda.
"""


# ┌─────────────────────────────────────────────────────────────┐
# │  FASE 3 — INBOX WHATSAPP E AGENTE CONVERSACIONAL          │
# │  Estimativa: 1-2 dias                                      │
# └─────────────────────────────────────────────────────────────┘


## 3.1 — Schema de conversas e webhook de entrada

### PROMPT CLAUDE CODE:
"""
Verificar se já existem tabelas de conversas no Supabase (conversation_threads,
messages, whatsapp_messages, message_history ou similar).

Se NÃO existirem, criar migration:

```sql
-- Threads de conversa (uma por contato)
CREATE TABLE IF NOT EXISTS conversation_threads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id        UUID REFERENCES clients(id),
  contact_name     TEXT NOT NULL,
  contact_phone    TEXT NOT NULL,
  channel          TEXT DEFAULT 'whatsapp',
  status           TEXT DEFAULT 'open', -- open, resolved, blocked
  assigned_to      UUID,
  ai_enabled       BOOLEAN DEFAULT true,
  last_message     TEXT,
  last_message_at  TIMESTAMPTZ,
  unread_count     INT DEFAULT 0,
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Mensagens individuais
CREATE TABLE IF NOT EXISTS conversation_messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id           UUID NOT NULL REFERENCES conversation_threads(id) ON DELETE CASCADE,
  direction           TEXT NOT NULL, -- inbound, outbound
  sender_type         TEXT NOT NULL, -- client, ai, human, system
  content             TEXT,
  media_url           TEXT,
  message_type        TEXT DEFAULT 'text', -- text, image, audio, document, sticker
  external_message_id TEXT,
  status              TEXT DEFAULT 'sent', -- sent, delivered, read, failed
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_threads_org ON conversation_threads(organization_id, last_message_at DESC);
CREATE INDEX idx_threads_phone ON conversation_threads(contact_phone);
CREATE INDEX idx_messages_thread ON conversation_messages(thread_id, created_at ASC);

ALTER TABLE conversation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_threads" ON conversation_threads FOR ALL USING (
  organization_id = get_user_org_id()
);
CREATE POLICY "org_messages" ON conversation_messages FOR ALL USING (
  thread_id IN (
    SELECT id FROM conversation_threads WHERE organization_id = get_user_org_id()
  )
);
```

Depois, criar o webhook de entrada da Evolution API:

`POST /api/webhooks/evolution`

```typescript
// app/api/webhooks/evolution/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Validar secret se configurado
  const secret = req.headers.get('x-skinnia-secret');
  if (process.env.EVOLUTION_WEBHOOK_SECRET && secret !== process.env.EVOLUTION_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await req.json();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Extrair dados da mensagem (formato Evolution API v2)
  const event = payload.event;
  if (event !== 'messages.upsert') return NextResponse.json({ ok: true });

  const message = payload.data?.message;
  const key = payload.data?.key;
  if (!message || key?.fromMe) return NextResponse.json({ ok: true }); // ignorar próprias msgs

  const phone = key?.remoteJid?.replace('@s.whatsapp.net', '') || '';
  const content = message.conversation || message.extendedTextMessage?.text || '';
  const pushName = payload.data?.pushName || 'Desconhecido';

  // Buscar organization pela instância da Evolution
  const instance = payload.instance;
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('evolution_instance', instance)
    .single();

  if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 });

  // Upsert thread
  const { data: thread } = await supabase
    .from('conversation_threads')
    .upsert({
      organization_id: org.id,
      contact_phone: phone,
      contact_name: pushName,
      last_message: content.substring(0, 100),
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'organization_id,contact_phone' })
    .select()
    .single();

  // Inserir mensagem
  await supabase.from('conversation_messages').insert({
    thread_id: thread.id,
    direction: 'inbound',
    sender_type: 'client',
    content,
    message_type: 'text',
    external_message_id: key?.id,
  });

  // Registrar automation_run
  await supabase.from('automation_runs').insert({
    organization_id: org.id,
    type: 'whatsapp_inbound',
    source: 'webhook',
    status: 'success',
    input: { phone, content: content.substring(0, 500) },
    related_client_id: thread?.client_id,
  });

  // Encaminhar para agente IA se ai_enabled = true
  if (thread?.ai_enabled !== false && process.env.ANTHROPIC_API_KEY) {
    // Processar em background — não aguardar resposta
    processWithAI({ thread, content, phone, org_id: org.id, supabase });
  }

  return NextResponse.json({ ok: true });
}
```

Criar também rota de registro do webhook na Evolution API (para executar manualmente):

`POST /api/integrations/evolution/register-webhook`

Que chame a API da Evolution para registrar a URL do webhook do SkinnIA.
"""


## 3.2 — Completar `/conversas` como Inbox WhatsApp real

### PROMPT CLAUDE CODE:
"""
A página `/conversas` está em placeholder. Transformar em inbox real
estilo WhatsApp Web usando as tabelas conversation_threads e conversation_messages.

LAYOUT SPLIT-VIEW:

```
┌──────────────────┬─────────────────────────────────────────┐
│  LISTA (30%)     │  ÁREA DE MENSAGENS (70%)                │
│                  │                                         │
│ [ Buscar... ]    │  Header: Nome | Telefone | Status       │
│ ──────────────── │  ─────────────────────────────────────  │
│ Card conversa 1  │                                         │
│ Card conversa 2  │  [balões de mensagem]                   │
│ Card conversa 3  │                                         │
│ ...              │  ─────────────────────────────────────  │
│                  │  [campo envio] [btn enviar]             │
└──────────────────┴─────────────────────────────────────────┘
```

LISTA DE CONVERSAS (esquerda):
- Busca por nome/telefone
- Filtros por tabs: Todas | IA Ativa | Humano | Não lidas
- Cards com: avatar inicial, nome, preview msg, timestamp, badge não lidas
- Ordenar por last_message_at DESC
- Infinite scroll ou paginação

ÁREA DE MENSAGENS (direita):
- Header: nome, telefone, avatar, badge status (IA/Humano), link para perfil do cliente
- Balões estilo WhatsApp:
  - Mensagens do cliente: alinhadas à esquerda, cor neutra
  - Mensagens da IA: alinhadas à direita, cor accent do SkinnIA + tag "IA"
  - Mensagens humanas: alinhadas à direita, cor diferente + tag "Humano"
- Scroll automático para a última mensagem
- Carregar mensagens em chunks de 50 (scroll infinito para cima)

ENVIO MANUAL:
- Input de texto + botão enviar
- Toggle "Enviar como IA / Humano"
- Ao enviar: POST /api/integrations/evolution/send-message
  + inserir em conversation_messages com sender_type = 'human'
- Se Evolution não configurada: botão desabilitado + tooltip explicativo

CONTROLE DE IA:
- Botão "Pausar IA" / "Reativar IA" no header da conversa
- Ao pausar: UPDATE conversation_threads SET ai_enabled = false
- Ao reativar: UPDATE conversation_threads SET ai_enabled = true
- Badge visível na lista e no header indicando estado atual

REAL-TIME com Supabase Realtime:
```javascript
useEffect(() => {
  const channel = supabase
    .channel('conversation-messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'conversation_messages',
      filter: `thread_id=eq.${activeThreadId}`,
    }, (payload) => {
      setMessages(prev => [...prev, payload.new]);
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [activeThreadId]);
```

Seguir identidade visual do SkinnIA com dark/light mode.
"""


## 3.3 — Completar agente conversacional do SkinnIA

### PROMPT CLAUDE CODE:
"""
Revisar `lib/agents/` e completar o agente principal do SkinnIA.

O agente deve saber:
- Atende negócios de beleza/estética: salão, clínica estética, esmalteria,
  barbearia, studio de sobrancelhas, estética facial/corporal, massagem, spa
- Consultar serviços, profissionais e disponibilidade antes de confirmar qualquer horário
- Criar agendamento somente após confirmação explícita do cliente
- Responder sempre em português brasileiro, tom profissional e acolhedor
- Respeitar pausa de IA (ai_enabled = false na thread)

FUNÇÃO processWithAI no webhook:

```typescript
async function processWithAI({ thread, content, phone, org_id, supabase }) {
  // Buscar histórico das últimas 10 mensagens
  const { data: history } = await supabase
    .from('conversation_messages')
    .select('direction, sender_type, content, created_at')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Buscar dados da organização e agente ativo
  const { data: orgData } = await supabase
    .from('organizations')
    .select('name, agents(*)')
    .eq('id', org_id)
    .single();

  const agent = orgData?.agents?.find(a => a.slug === 'reception' && a.status === 'active');
  if (!agent) return; // Agente não está ativo

  // Montar contexto
  const systemPrompt = agent.prompt_base || `
Você é a recepcionista virtual da ${orgData.name}, um negócio de beleza/estética.
Suas responsabilidades:
1. Recepcionar clientes e responder dúvidas sobre serviços e horários
2. Agendar, remarcar e cancelar agendamentos
3. Quando o cliente pedir um horário, SEMPRE verificar disponibilidade antes de confirmar
4. Responder em português brasileiro, tom profissional e acolhedor
5. Para situações complexas, oferecer contato humano

Para verificar disponibilidade ou criar agendamento, retorne um JSON estruturado:
{ "action": "check_availability", "service": "nome do serviço", "date": "YYYY-MM-DD", "period": "manha|tarde|noite" }
{ "action": "book_appointment", "client_name": "...", "service": "...", "date": "...", "time": "HH:MM" }
{ "action": "human_handoff", "reason": "..." }
Se não precisar de ação, responda normalmente em texto.
  `.trim();

  // Chamar Anthropic
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        ...history.reverse().map(m => ({
          role: m.direction === 'inbound' ? 'user' : 'assistant',
          content: m.content,
        })),
        { role: 'user', content },
      ],
    }),
  });

  const data = await response.json();
  const aiText = data.content?.[0]?.text || '';

  // Detectar action JSON
  let action = null;
  const jsonMatch = aiText.match(/\{[\s\S]*?"action"[\s\S]*?\}/);
  if (jsonMatch) {
    try { action = JSON.parse(jsonMatch[0]); } catch(e) {}
  }

  // Processar action ou responder diretamente
  let finalResponse = aiText;
  if (action?.action === 'check_availability') {
    // Chamar check-availability edge function
    // ... formatar slots e retornar ao cliente
    finalResponse = await handleCheckAvailability(action, org_id, supabase);
  } else if (action?.action === 'book_appointment') {
    finalResponse = await handleBookAppointment(action, thread, org_id, supabase);
  } else if (action?.action === 'human_handoff') {
    await supabase.from('conversation_threads')
      .update({ ai_enabled: false })
      .eq('id', thread.id);
    finalResponse = 'Estou transferindo você para um de nossos atendentes. Em breve entrarão em contato!';
  }

  // Enviar resposta via Evolution API
  await sendEvolutionMessage(phone, finalResponse, org_id, supabase);

  // Salvar mensagem da IA
  await supabase.from('conversation_messages').insert({
    thread_id: thread.id,
    direction: 'outbound',
    sender_type: 'ai',
    content: finalResponse,
  });
}
```

Implementar as funções handleCheckAvailability e handleBookAppointment
chamando as APIs/rotas existentes do projeto.
"""


# ┌─────────────────────────────────────────────────────────────┐
# │  FASE 4 — CLIENTES: EXPORT, HISTÓRICO E CAMPANHA          │
# │  Estimativa: 0.5 dia                                       │
# └─────────────────────────────────────────────────────────────┘


## 4.1 — Export CSV e completar funcionalidades de clientes

### PROMPT CLAUDE CODE:
"""
Na página Clientes do SkinnIA, implementar as 3 funcionalidades faltantes:

**1. Export CSV**

Botão "Exportar CSV" no header da página.
Exporta exatamente os clientes que estão filtrados no momento.

```typescript
function exportToCSV(clients: Client[]) {
  const headers = ['Nome', 'Telefone', 'Email', 'Status', 'Último agendamento', 'Criado em'];
  const rows = clients.map(c => [
    c.name,
    c.phone,
    c.email || '',
    c.status || '',
    c.last_appointment_at ? format(new Date(c.last_appointment_at), 'dd/MM/yyyy') : '',
    format(new Date(c.created_at), 'dd/MM/yyyy'),
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clientes-${format(new Date(), 'dd-MM-yyyy')}.csv`;
  a.click();
}
```

**2. Histórico de conversas no perfil lateral**

No drawer/modal de perfil do cliente, adicionar aba "Conversas":
- Buscar conversation_threads WHERE contact_phone = cliente.phone
- Listar threads com preview, data, status
- Ao clicar: navegar para /conversas?thread={threadId}
- Se não houver conversas: mostrar "Nenhuma conversa registrada"

**3. Botão "Enviar campanha de retorno" funcional**

O botão já existe na UI. Torná-lo funcional:
- Ao clicar: abrir modal de confirmação
- Modal mostra template editável (buscar da tabela agents onde slug = 'reactivation')
- Campo para customizar a mensagem para ESTE cliente específico
- Preview da mensagem com variáveis substituídas (nome, dias sem vir)
- Botão confirmar: POST /api/automation/reactivation (rota já existe)
  Body: { client_id, custom_message?, organization_id }
- Se Evolution não configurada: botão desabilitado + tooltip "Configure o WhatsApp em Integrações"
- Após envio: mostrar toast de sucesso + registrar automation_run
"""


# ┌─────────────────────────────────────────────────────────────┐
# │  FASE 5 — CRM / FUNIL DE CLIENTES (Módulo de expansão)    │
# │  Estimativa: 1-2 dias                                      │
# └─────────────────────────────────────────────────────────────┘


## 5.1 — Schema do CRM

### PROMPT CLAUDE CODE (ou SQL direto):
"""
Verificar se já existe tabela de funil/CRM no Supabase.
Se NÃO existir, criar via SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS funnels (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  is_default       BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS funnel_stages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id  UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT DEFAULT '#22C55E',
  position   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS funnel_contacts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  funnel_id        UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  stage_id         UUID NOT NULL REFERENCES funnel_stages(id),
  client_id        UUID REFERENCES clients(id),
  name             TEXT NOT NULL,
  phone            TEXT,
  email            TEXT,
  source           TEXT, -- whatsapp, instagram, site, indicacao, manual, campanha
  service_interest TEXT,
  estimated_value  NUMERIC,
  notes            TEXT,
  assigned_to      UUID,
  position         INT DEFAULT 0,
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS funnel_history (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id     UUID NOT NULL REFERENCES funnel_contacts(id) ON DELETE CASCADE,
  from_stage_id  UUID REFERENCES funnel_stages(id),
  to_stage_id    UUID NOT NULL REFERENCES funnel_stages(id),
  moved_by       TEXT DEFAULT 'system',
  note           TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_funnels_org ON funnels(organization_id);
CREATE INDEX idx_funnel_contacts_stage ON funnel_contacts(stage_id, position);
CREATE INDEX idx_funnel_contacts_phone ON funnel_contacts(phone);

ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_funnels" ON funnels FOR ALL USING (
  organization_id = get_user_org_id()
);
CREATE POLICY "org_funnel_stages" ON funnel_stages FOR ALL USING (
  funnel_id IN (SELECT id FROM funnels WHERE organization_id = get_user_org_id())
);
CREATE POLICY "org_funnel_contacts" ON funnel_contacts FOR ALL USING (
  organization_id = get_user_org_id()
);
CREATE POLICY "org_funnel_history" ON funnel_history FOR ALL USING (
  contact_id IN (SELECT id FROM funnel_contacts WHERE organization_id = get_user_org_id())
);

-- Seed: funil padrão para SkinnIA
-- Executar depois de pegar o organization_id do seed existente:
-- INSERT INTO funnels (organization_id, name, is_default) VALUES ('ORG_ID', 'Funil Comercial', true);
-- INSERT INTO funnel_stages (funnel_id, name, color, position) VALUES
--   ('FUNNEL_ID', 'Novo Lead', '#3B82F6', 0),
--   ('FUNNEL_ID', 'Conversa Iniciada', '#8B5CF6', 1),
--   ('FUNNEL_ID', 'Serviço Escolhido', '#F59E0B', 2),
--   ('FUNNEL_ID', 'Horário Oferecido', '#F97316', 3),
--   ('FUNNEL_ID', 'Agendamento Marcado', '#22C55E', 4),
--   ('FUNNEL_ID', 'Compareceu', '#10B981', 5),
--   ('FUNNEL_ID', 'Cliente Recorrente', '#06B6D4', 6),
--   ('FUNNEL_ID', 'Perdido', '#EF4444', 7);
```
"""


## 5.2 — Frontend CRM/Kanban

### PROMPT CLAUDE CODE:
"""
No frontend SkinnIA, criar o módulo CRM em `/crm`.

INSTALAÇÃO:
```bash
npm install @dnd-kit/core @dnd-kit/sortable
```
(se ainda não instalado na Fase 2.3)

PÁGINA /crm — Kanban:
- Colunas = etapas do funil (buscar funnel_stages da org)
- Cards = funnel_contacts (buscar por stage_id)
- Header de cada coluna: nome + contador + valor total estimado
- Drag-and-drop entre colunas para mover contato de etapa

AO MOVER CARD:
```javascript
async function onDrop(contactId, newStageId, oldStageId) {
  // Atualizar UI imediatamente (optimistic update)
  // Persistir no banco
  await supabase.from('funnel_contacts')
    .update({ stage_id: newStageId, updated_at: new Date().toISOString() })
    .eq('id', contactId);
  
  // Registrar histórico
  await supabase.from('funnel_history')
    .insert({ contact_id: contactId, from_stage_id: oldStageId, to_stage_id: newStageId });
}
```

CARD DO CONTATO mostra:
- Nome, telefone, fonte (badge), valor estimado, dias desde criação

MODAL NOVO CONTATO:
- Nome, telefone, email, fonte (select), serviço de interesse, valor estimado, notas
- Etapa inicial (select)

MODAL DETALHE (ao clicar no card):
- Dados completos
- Timeline de movimentações (funnel_history)
- Link "Abrir WhatsApp" se tiver telefone
- Link "Ver agendamentos" se linked a um client_id
- Notas editáveis inline
- Botões: Editar, Excluir

FILTROS no header:
- Por fonte (select)
- Por etapa (select)
- Por período (date range)

INTEGRAÇÃO AUTOMÁTICA via webhook da Evolution (Fase 3.1):
- Nova mensagem WhatsApp = criar/atualizar funnel_contact na etapa "Novo Lead"
- Continue On Fail: true — CRM não pode parar o atendimento

Adicionar "CRM" na sidebar com ícone de funil.
"""


# ┌─────────────────────────────────────────────────────────────┐
# │  FASE 6 — GESTÃO DE ASSINATURAS / PLANOS (SaaS)           │
# │  Estimativa: 1-2 dias                                      │
# └─────────────────────────────────────────────────────────────┘


## 6.1 — Schema de assinaturas

### PROMPT CLAUDE CODE:
"""
Verificar se já existe tabela de subscription_plans no Supabase.
Se NÃO existir, criar:

```sql
CREATE TABLE IF NOT EXISTS subscription_plans (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL, -- Starter, Pro, Enterprise
  slug                    TEXT UNIQUE NOT NULL,
  price_monthly           NUMERIC,
  price_yearly            NUMERIC,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly  TEXT,
  max_agents              INT DEFAULT 2,
  max_messages            INT DEFAULT 1000,
  features                JSONB DEFAULT '{}',
  is_active               BOOLEAN DEFAULT true,
  created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id                  UUID NOT NULL REFERENCES subscription_plans(id),
  stripe_customer_id       TEXT,
  stripe_subscription_id   TEXT,
  status                   TEXT DEFAULT 'trialing', -- trialing, active, past_due, canceled
  current_period_start     TIMESTAMPTZ,
  current_period_end       TIMESTAMPTZ,
  trial_end                TIMESTAMPTZ,
  cancel_at                TIMESTAMPTZ,
  metadata                 JSONB DEFAULT '{}',
  created_at               TIMESTAMPTZ DEFAULT now(),
  updated_at               TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_subscriptions" ON subscriptions FOR ALL USING (
  organization_id = get_user_org_id()
);

-- Seed planos
INSERT INTO subscription_plans (name, slug, price_monthly, max_agents, max_messages, features)
VALUES
  ('Starter', 'starter', 197, 2, 500, '{
    "agents": ["reception", "reminder"],
    "scheduling": true,
    "support": "email"
  }'::jsonb),
  ('Pro', 'pro', 397, 5, 3000, '{
    "agents": ["reception", "reminder", "reactivation", "confirmation", "post_service"],
    "scheduling": true,
    "crm": true,
    "financial": true,
    "support": "whatsapp"
  }'::jsonb),
  ('Enterprise', 'enterprise', 797, 10, 15000, '{
    "agents": "unlimited",
    "scheduling": true,
    "crm": true,
    "financial": true,
    "multi_workspace": true,
    "custom_agents": true,
    "support": "dedicated"
  }'::jsonb)
ON CONFLICT (slug) DO NOTHING;
```
"""


## 6.2 — Frontend de billing e pricing

### PROMPT CLAUDE CODE:
"""
No frontend SkinnIA, criar 2 páginas de assinatura:

**1. Página /billing** (protegida, para usuários logados):

Card "Seu Plano Atual":
- Nome do plano, status (badge: Em teste / Ativo / Vencido / Cancelado)
- Data de próxima cobrança ou fim de trial
- Uso atual: mensagens enviadas este mês / limite
- Agentes ativos / máximo do plano

Buscar subscription da org via Supabase:
```javascript
const { data: sub } = await supabase
  .from('subscriptions')
  .select('*, subscription_plans(*)')
  .eq('organization_id', orgId)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();
```

Se não houver subscription: mostrar banner "Sem assinatura ativa — entre em contato"

Botão "Fazer Upgrade" → redireciona para /pricing

Se plano Pro ou superior: mostrar botão "Gerenciar Assinatura" (futuro portal Stripe)

**2. Página /pricing** (pública):

3 cards: Starter | Pro | Enterprise
Cada card:
- Nome, preço mensal
- Toggle mensal/anual (anual = 20% desconto)
- Lista de features incluídas
- CTA "Começar agora" ou "Falar com comercial" (Enterprise)

Banner no rodapé: "Pagamento gerenciado manualmente. Entre em contato pelo WhatsApp."
(enquanto Stripe não estiver integrado)

**Hook useSubscription() no AuthContext ou context separado:**
```typescript
function useSubscription() {
  const { subscription } = useAuth(); // assumindo que AuthContext carrega subscription
  
  function canUse(feature: string): boolean {
    if (!subscription) return false;
    const features = subscription.subscription_plans?.features as Record<string, any>;
    return !!features?.[feature];
  }
  
  function isAtLimit(metric: 'messages' | 'agents'): boolean {
    // comparar uso atual vs limite do plano
    return false; // implementar com métricas reais
  }
  
  return { subscription, canUse, isAtLimit };
}
```

Nas páginas de agentes: se o agente não está no plano atual, mostrar card bloqueado
com cadeado e botão "Upgrade para Pro".
"""


# ┌─────────────────────────────────────────────────────────────┐
# │  FASE 7 — N8N: ATIVAR E DOCUMENTAR WORKFLOWS              │
# │  Estimativa: 0.5 dia                                       │
# └─────────────────────────────────────────────────────────────┘


## 7.1 — Ativar e documentar os 7 workflows

### PROMPT CLAUDE CODE:
"""
Os 7 workflows n8n do SkinnIA foram importados mas estão inativos.
Criar documentação e verificar cada um antes de ativar.

Criar `docs/n8n-skinnia-workflows.md` com:

Para cada um dos 7 workflows, documentar:
- Objetivo
- Tipo de trigger (webhook, schedule, event)
- Variáveis n8n necessárias (SUPABASE_URL, SUPABASE_KEY, EVOLUTION_API_URL, etc.)
- Tabelas que lê e escreve
- Como testar antes de ativar
- Comando de ativação

**Verificações antes de ativar cada workflow:**

1. Nenhum valor hardcoded de organization_id — usar variável dinâmica
2. Credenciais Supabase e Evolution como variáveis n8n (não no código)
3. Continue On Fail: true nos nodes de envio WhatsApp
4. Nodes de log registrando em automation_runs via Supabase
5. Delay de 1-2s entre envios (anti-spam)

**Ordem de ativação (uma por vez, testar cada):**
1. Receber mensagem WhatsApp (webhook) → testar com curl
2. Lembrete de agendamento (schedule: cada 30min) → testar manualmente
3. Confirmação de presença (webhook resposta cliente) → testar com simulação
4. No-show automático (schedule: cada hora) → testar manualmente
5. Reativação de clientes (schedule: diário 10h) → testar com cliente de teste
6. Pós-agendamento (webhook após criação de agendamento) → testar ao criar agendamento
7. Webhook Mercado Pago → testar com webhook test do MP

**No painel /integracoes**, mostrar lista dos 7 workflows com status.
Se N8N_BASE_URL estiver configurado, buscar status via:
GET {N8N_BASE_URL}/api/v1/workflows
(com auth token N8N_WEBHOOK_SECRET como Bearer)

Se N8N não configurado: mostrar todos com status "Verificar manualmente no n8n"
"""


# ┌─────────────────────────────────────────────────────────────┐
# │  FASE 8 — /agentes: Central de configuração de IA         │
# │  Estimativa: 0.5 dia                                       │
# └─────────────────────────────────────────────────────────────┘


## 8.1 — Completar página /agentes

### PROMPT CLAUDE CODE:
"""
A página `/agentes` existe mas está em placeholder. Verificar se já existe
tabela `agents` no Supabase (pode chamar automation_agents, ai_agents, etc.).

AGENTES PADRÃO DO SKINNIA:
- reception (Recepção / Atendimento)
- scheduling (Agendamento)
- reactivation (Reativação de clientes)
- confirmation (Confirmação de agenda)
- reminder (Lembretes automáticos)
- post_service (Pós-atendimento)
- no_show (Recuperação de no-show)

INTERFACE DA PÁGINA:
Grid de cards, um por agente.

Cada card mostra:
- Ícone (específico por tipo)
- Nome do agente
- Descrição curta
- Toggle ativo/inativo (UPDATE agents SET status = 'active'/'paused')
- Badge: Ativo (verde) / Pausado (cinza) / Erro (vermelho)
- Botão "Configurar" → abre drawer de configuração

DRAWER DE CONFIGURAÇÃO do agente:
- Nome editável
- Prompt base (textarea grande, editável)
- Tom de voz (select: formal, informal, profissional, amigável)
- Horário de funcionamento:
  - Toggle "Sempre ativo" ou customizar por dia/hora
  - Se customizado: grade de seleção de dias + horários
- Canal ativo: WhatsApp (único por enquanto)
- Templates de mensagem (editar por tipo: boas-vindas, lembrete, reativação)
- Variáveis disponíveis (exibir lista: {nome_cliente}, {nome_negocio}, {data_agendamento}, etc.)
- Últimas 5 execuções (link para /logs com filtro)
- Botão "Testar agente" → abre modal de simulação com número de teste

SIMULAÇÃO DE TESTE:
- Campo: "Simular mensagem do cliente"
- Campo: número de telefone para enviar (opcional)
- Botão "Testar" → chama a lógica do agente com a mensagem simulada
- Mostra a resposta gerada pela IA sem enviar via WhatsApp (apenas exibe)
- Se telefone fornecido e Evolution configurada: opção de enviar de verdade

Seguir identidade visual do SkinnIA, dark/light mode.
"""


# ┌─────────────────────────────────────────────────────────────┐
# │  FASE 9 — RELATÓRIOS E ANALYTICS                          │
# │  Estimativa: 0.5 dia                                       │
# └─────────────────────────────────────────────────────────────┘


## 9.1 — Dashboard aprimorado e relatórios

### PROMPT CLAUDE CODE:
"""
Melhorar o Dashboard existente com métricas e relatórios mais completos.

Na página /relatorios (criar nova) ou expandir o Dashboard:

**Card 1 — Agenda (últimos 30 dias)**:
- Total de agendamentos
- Taxa de comparecimento (%) — appointments WHERE status = 'completed' / total
- Taxa de no-show (%)
- Cancelamentos
- Serviços mais agendados (top 3 com barra de progresso)

**Card 2 — Clientes**:
- Novos clientes no período
- Clientes reativados (vieram de inatividade > 30 dias)
- Inativos há mais de 30 dias (para campanha)
- Taxa de retorno (clientes com 2+ agendamentos / total)

**Card 3 — WhatsApp/IA** (se conversation_threads existir):
- Conversas iniciadas no período
- Agendamentos gerados pela IA
- Handoffs para humano
- Mensagens enviadas (de automation_runs)

**Card 4 — Financeiro**:
- Receita do período (de payments WHERE status = 'approved')
- Ticket médio
- Pendências

**Gráfico — Agendamentos por dia** (últimos 30 dias):
- Barras: confirmados, completados, no-show, cancelados
- Usar recharts (já no projeto) ou chart.js

```typescript
// Query base
const { data } = await supabase
  .from('appointments')
  .select('status, start_datetime, service:services(name), professional:professionals(name)')
  .eq('organization_id', orgId)
  .gte('start_datetime', startDate)
  .lte('start_datetime', endDate)
  .order('start_datetime', { ascending: true });
```

Filtros: período (últimos 7d / 30d / 90d / custom date range)
Seguir identidade visual do SkinnIA.
"""


# ═══════════════════════════════════════════════════════════════
# RESUMO — ORDEM DE EXECUÇÃO
# ═══════════════════════════════════════════════════════════════

# SEMANA 1 (fechar o que está pendente):
# ├── Fase 1.1: Normalizar ENV + rota /api/integrations/status (30 min)
# ├── Fase 1.2: Completar /integracoes com status real (45 min)
# ├── Fase 1.3: Completar /logs com automation_runs (45 min)
# └── Fase 1.4: Revisar e documentar Edge Functions (30 min)
#
# SEMANA 2 (completar Agenda e Conversas):
# ├── Fase 2.1: Modal novo agendamento (45 min)
# ├── Fase 2.2: Modal detalhe + ações do agendamento (30 min)
# ├── Fase 2.3: Drag-and-drop + filtro por profissional (45 min)
# ├── Fase 2.4: Bloqueios de agenda — migration + página (30 min)
# ├── Fase 3.1: Schema conversas + webhook Evolution (1h)
# ├── Fase 3.2: Completar /conversas inbox real (2h)
# └── Fase 3.3: Completar agente conversacional (1h)
#
# SEMANA 3 (expansão — CRM e clientes):
# ├── Fase 4.1: Export CSV + histórico conversas + campanha (45 min)
# ├── Fase 5.1: Schema CRM — SQL (15 min)
# ├── Fase 5.2: Frontend CRM/Kanban (2-3h)
# └── Fase 8.1: Completar /agentes (1h)
#
# SEMANA 4 (SaaS — planos, n8n, relatórios):
# ├── Fase 6.1: Schema assinaturas — SQL (15 min)
# ├── Fase 6.2: Frontend /billing e /pricing (1.5h)
# ├── Fase 7.1: Ativar e documentar n8n workflows (1h)
# └── Fase 9.1: Relatórios e analytics (1h)
#
# TOTAL: ~4 semanas / ~20h de trabalho com Claude Code
#
# ═══════════════════════════════════════════════════════════════
# PRÉ-REQUISITOS EXTERNOS (não são código — precisam de ação manual)
# ═══════════════════════════════════════════════════════════════
#
# ANTES de executar qualquer fase:
# [ ] Subir Evolution API via Docker (ou usar serviço cloud)
# [ ] Parear instância WhatsApp com QR Code
# [ ] Adicionar EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE_NAME no .env
# [ ] Adicionar ANTHROPIC_API_KEY no .env
# [ ] Adicionar MERCADOPAGO_ACCESS_TOKEN e MERCADOPAGO_WEBHOOK_SECRET no .env (Fase 6+)
# [ ] Rodar: supabase functions deploy webhook-payment check-availability setup-organization
# [ ] Configurar variáveis de ambiente das Edge Functions no dashboard Supabase
# [ ] Ativar workflows n8n após Fase 3 (precisam de Evolution API rodando)
