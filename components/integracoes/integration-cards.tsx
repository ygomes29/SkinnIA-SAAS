"use client";

import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface IntegrationStatus {
  whatsapp: {
    instance: string | null;
    status: string;
  };
  n8n: {
    url: string | null;
    configured: boolean;
  };
  mercadopago: {
    configured: boolean;
    webhookConfigured: boolean;
  };
  anthropic: {
    configured: boolean;
  };
}

function StatusBadge({ ok, label }: { ok: boolean; label?: string }) {
  return (
    <Badge variant={ok ? "success" : "warning"}>
      {label ?? (ok ? "Configurado" : "Pendente")}
    </Badge>
  );
}

function StatusIcon({ ok }: { ok: boolean }) {
  if (ok) return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
  return <AlertCircle className="h-5 w-5 text-amber-400" />;
}

function IntegrationCard({
  title,
  description,
  ok,
  badge,
  children,
}: {
  title: string;
  description: string;
  ok: boolean;
  badge?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className={cn(
      "border-2 transition-colors",
      ok ? "border-emerald-500/20" : "border-amber-500/20"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <StatusIcon ok={ok} />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="mt-1 text-xs">{description}</CardDescription>
            </div>
          </div>
          <StatusBadge ok={ok} label={badge} />
        </div>
      </CardHeader>
      {children && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

function EnvStep({ label, done }: { label: string; done: boolean }) {
  return (
    <li className="flex items-center gap-2 text-xs text-[var(--sk-text-secondary)]">
      {done ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
      ) : (
        <XCircle className="h-3.5 w-3.5 shrink-0 text-[var(--sk-text-muted)]" />
      )}
      {label}
    </li>
  );
}

export function IntegrationCards({ status }: { status: IntegrationStatus }) {
  const waConnected = status.whatsapp.status === "connected";
  const waHasInstance = Boolean(status.whatsapp.instance);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* WhatsApp / Evolution API */}
      <IntegrationCard
        title="WhatsApp (Evolution API)"
        description="Canal de mensagens para agendamentos e confirmações."
        ok={waConnected}
        badge={waConnected ? "Conectado" : waHasInstance ? "Instância criada" : "Desconectado"}
      >
        <ul className="space-y-1.5">
          <EnvStep label="Instância criada" done={waHasInstance} />
          <EnvStep label="WhatsApp pareado" done={waConnected} />
          <EnvStep
            label={`EVOLUTION_API_URL configurada`}
            done={Boolean(status.n8n.url)}
          />
        </ul>
        {status.whatsapp.instance && (
          <p className={cn(
            "mt-3 rounded-xl px-3 py-2 text-xs",
            "bg-[var(--sk-bg-panel)] text-[var(--sk-text-muted)]"
          )}>
            Instância: <span className="font-mono">{status.whatsapp.instance}</span>
          </p>
        )}
        {!waConnected && (
          <p className="mt-3 text-xs text-[var(--sk-text-muted)]">
            Configure a Evolution API via Docker e execute{" "}
            <code className="rounded bg-[var(--sk-bg-panel)] px-1 py-0.5 font-mono">
              docker-compose up
            </code>{" "}
            para parear o QR code.
          </p>
        )}
      </IntegrationCard>

      {/* n8n */}
      <IntegrationCard
        title="n8n (Orquestrador)"
        description="Workflows de automação para agendamento, lembretes e reativação."
        ok={status.n8n.configured}
      >
        <ul className="space-y-1.5">
          <EnvStep label="N8N_BASE_URL configurada" done={Boolean(status.n8n.url)} />
          <EnvStep label="N8N_API_KEY configurada" done={status.n8n.configured} />
          <EnvStep label="Workflows importados e ativos" done={false} />
        </ul>
        {status.n8n.url && (
          <p className={cn(
            "mt-3 rounded-xl px-3 py-2 text-xs",
            "bg-[var(--sk-bg-panel)] text-[var(--sk-text-muted)]"
          )}>
            URL: <span className="font-mono">{status.n8n.url}</span>
          </p>
        )}
      </IntegrationCard>

      {/* Mercado Pago */}
      <IntegrationCard
        title="Mercado Pago"
        description="Cobrança de sinal via Pix, estornos e carteira de créditos."
        ok={status.mercadopago.configured && status.mercadopago.webhookConfigured}
      >
        <ul className="space-y-1.5">
          <EnvStep
            label="MERCADOPAGO_ACCESS_TOKEN configurada"
            done={status.mercadopago.configured}
          />
          <EnvStep
            label="MERCADOPAGO_WEBHOOK_SECRET configurada"
            done={status.mercadopago.webhookConfigured}
          />
          <EnvStep
            label="Edge Function webhook-payment deployada"
            done={false}
          />
        </ul>
        {!status.mercadopago.configured && (
          <p className="mt-3 text-xs text-[var(--sk-text-muted)]">
            Adicione as variáveis no{" "}
            <code className="rounded bg-[var(--sk-bg-panel)] px-1 py-0.5 font-mono">.env.local</code>{" "}
            e no painel da Vercel.
          </p>
        )}
      </IntegrationCard>

      {/* Anthropic */}
      <IntegrationCard
        title="Anthropic Claude"
        description="Agente conversacional para atendimento e reativação de clientes."
        ok={status.anthropic.configured}
      >
        <ul className="space-y-1.5">
          <EnvStep label="ANTHROPIC_API_KEY configurada" done={status.anthropic.configured} />
          <EnvStep
            label="Agente de atendimento ativo"
            done={status.anthropic.configured}
          />
        </ul>
        {!status.anthropic.configured && (
          <p className="mt-3 text-xs text-[var(--sk-text-muted)]">
            Crie uma API key em{" "}
            <span className="font-medium text-[var(--sk-text-secondary)]">console.anthropic.com</span>{" "}
            e adicione como{" "}
            <code className="rounded bg-[var(--sk-bg-panel)] px-1 py-0.5 font-mono">
              ANTHROPIC_API_KEY
            </code>.
          </p>
        )}
      </IntegrationCard>
    </div>
  );
}
