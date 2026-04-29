import { getAgentConfigs } from "@/lib/dashboard-data";
import { AgentManager } from "@/components/agentes/agent-manager";

export default async function AgentesPage() {
  const agents = await getAgentConfigs();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-[--sk-text-brand]">Agentes IA</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--sk-text-primary)]">
          Configuração de agentes inteligentes
        </h1>
        <p className="mt-2 text-[--sk-text-secondary]">
          Ative, pause e personalize cada agente de automação.
        </p>
      </div>

      <AgentManager initialAgents={agents} />
    </div>
  );
}
