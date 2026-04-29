import { getAutomationRuns } from "@/lib/dashboard-data";
import { LogsTable } from "@/components/logs/logs-table";

export default async function LogsPage() {
  const runs = await getAutomationRuns();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-[--sk-text-brand]">Logs & Eventos</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--sk-text-primary)]">
          Execuções de automação
        </h1>
        <p className="mt-2 text-[--sk-text-secondary]">
          Histórico de workflows, webhooks e schedules disparados.
        </p>
      </div>

      <LogsTable runs={runs} />
    </div>
  );
}
