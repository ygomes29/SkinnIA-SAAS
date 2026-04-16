import { getOrganization, getAgentConfigs } from "@/lib/dashboard-data";
import { OrgSettingsForm } from "@/components/configuracoes/org-settings-form";
import { AgentSettingsForm } from "@/components/configuracoes/agent-settings-form";

export default async function ConfiguracoesPage() {
  const [org, agentConfigs] = await Promise.all([getOrganization(), getAgentConfigs()]);
  const agent = agentConfigs.find((c) => c.agent_key === "atendimento") ?? null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-[--sk-text-brand]">Configurações</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Organização, canais e personalidade do agente</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <OrgSettingsForm org={org} />
        <AgentSettingsForm agent={agent} />
      </div>
    </div>
  );
}
