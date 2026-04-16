import { CheckCircle2, Clock3, XCircle, Zap, ZapOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAutomationRuns, getAgentConfigs, getMessageTemplates } from "@/lib/dashboard-data";
import { formatRelativeDate } from "@/lib/utils/date";

const AGENT_LABELS: Record<string, string> = {
  atendimento: "Atendimento",
  agendamento: "Agendamento",
  financeiro: "Financeiro",
  cancelamento: "Cancelamento",
  reativacao: "Reativação",
  pos_atendimento: "Pós-atendimento"
};

function statusIcon(status: "running" | "success" | "error" | "skipped") {
  if (status === "success") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (status === "error") return <XCircle className="h-4 w-4 text-rose-400" />;
  return <Clock3 className="h-4 w-4 text-amber-300" />;
}

export default async function AutomacaoPage() {
  const [runs, agentConfigs, templates] = await Promise.all([
    getAutomationRuns(),
    getAgentConfigs(),
    getMessageTemplates()
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-pink-200/70">Automação</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Agentes, logs e templates operacionais</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status dos agentes</CardTitle>
          <CardDescription>Visão rápida dos blocos conversacionais e financeiros.</CardDescription>
        </CardHeader>
        <CardContent>
          {agentConfigs.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum agente configurado.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {agentConfigs.map((agent) => (
                <div
                  className="rounded-3xl border border-white/10 bg-slate-950/40 p-4"
                  key={agent.id}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">
                      {AGENT_LABELS[agent.agent_key] ?? agent.agent_key}
                    </h3>
                    <Badge variant={agent.is_active ? "success" : "warning"}>
                      {agent.is_active ? "Ativo" : "Pausado"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{agent.name}</p>
                  {agent.tone ? (
                    <p className="mt-1 text-xs text-slate-500">Tom: {agent.tone}</p>
                  ) : null}
                  <div className="mt-4 flex items-center gap-2">
                    {agent.is_active ? (
                      <Zap className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <ZapOff className="h-4 w-4 text-slate-500" />
                    )}
                    <span className="text-xs text-slate-400">
                      {agent.is_active ? "Operando via n8n" : "Desativado"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logs de automação</CardTitle>
          <CardDescription>Execuções recentes vindas de webhooks, internos e schedules.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {runs.length === 0 ? (
            <p className="text-sm text-slate-500">Sem execuções recentes.</p>
          ) : (
            runs.map((run) => (
              <div
                className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/40 p-4 md:flex-row md:items-center md:justify-between"
                key={run.id}
              >
                <div className="flex items-center gap-3">
                  {statusIcon(run.status)}
                  <div>
                    <p className="font-semibold text-white">{run.workflow_name}</p>
                    <p className="text-sm text-slate-400">
                      {run.trigger_type ?? "interno"} • {run.duration_ms ?? 0} ms
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      run.status === "success"
                        ? "success"
                        : run.status === "error"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {run.status}
                  </Badge>
                  <span className="text-sm text-slate-400">{formatRelativeDate(run.created_at)}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {templates.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Templates de mensagem</CardTitle>
            <CardDescription>Mensagens transacionais configuradas para o WhatsApp.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {templates.map((t) => (
              <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4" key={t.id}>
                <p className="font-semibold text-white">{t.title}</p>
                <p className="mt-1 text-sm text-slate-300">{t.body}</p>
                {t.variables.length > 0 ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Variáveis: {t.variables.map((v) => `{${v}}`).join(", ")}
                  </p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
