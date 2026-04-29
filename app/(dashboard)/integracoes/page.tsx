import { getOrganization } from "@/lib/dashboard-data";
import { IntegrationCards } from "@/components/integracoes/integration-cards";

export default async function IntegracoesPage() {
  const org = await getOrganization();

  const status = {
    whatsapp: {
      instance: org?.whatsapp_instance ?? null,
      status: (org?.whatsapp_status ?? "disconnected") as string,
    },
    n8n: {
      url: process.env.N8N_BASE_URL ?? null,
      configured: Boolean(process.env.N8N_BASE_URL && process.env.N8N_API_KEY),
    },
    mercadopago: {
      configured: Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN),
      webhookConfigured: Boolean(process.env.MERCADOPAGO_WEBHOOK_SECRET),
    },
    anthropic: {
      configured: Boolean(process.env.ANTHROPIC_API_KEY),
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-[--sk-text-brand]">Integrações</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--sk-text-primary)]">
          Status das integrações
        </h1>
        <p className="mt-2 text-[--sk-text-secondary]">
          Visão do estado de cada serviço conectado à plataforma.
        </p>
      </div>

      <IntegrationCards status={status} />
    </div>
  );
}
