import { CheckCircle2, Clock3, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAutomationRuns } from "@/lib/dashboard-data";
import { formatRelativeDate } from "@/lib/utils/date";

const agents = [
  { name: "Atendimento", active: true, status: "Operando", interactions: 42 },
  { name: "Agendamento", active: true, status: "Operando", interactions: 18 },
  { name: "Confirmação", active: true, status: "Operando", interactions: 24 },
  { name: "Reativação", active: true, status: "Operando", interactions: 7 },
  { name: "Pós-atendimento", active: true, status: "Operando", interactions: 11 },
  { name: "Financeiro", active: false, status: "Pausado", interactions: 5 }
];

function statusIcon(status: "running" | "success" | "error" | "skipped") {
  if (status === "success") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (status === "error") return <XCircle className="h-4 w-4 text-rose-400" />;
  return <Clock3 className="h-4 w-4 text-amber-300" />;
}

export default async function AutomacaoPage() {
  const runs = await getAutomationRuns();

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
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => (
            <div
              className="rounded-3xl border border-white/10 bg-slate-950/40 p-4"
              key={agent.name}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">{agent.name}</h3>
                <Badge variant={agent.active ? "success" : "warning"}>
                  {agent.active ? "Ativo" : "Pausado"}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-slate-400">{agent.status}</p>
              <p className="mt-4 text-3xl font-semibold text-white">{agent.interactions}</p>
              <p className="text-sm text-slate-400">interações hoje</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logs de automação</CardTitle>
          <CardDescription>Execuções recentes vindas de webhooks, internos e schedules.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {runs.map((run) => (
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
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Templates ativos</CardTitle>
            <CardDescription>Base para mensagens transacionais no WhatsApp.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Confirmação 24h",
              "Pix de sinal",
              "Reativação 45 dias",
              "Pós-atendimento NPS"
            ].map((template) => (
              <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4" key={template}>
                <p className="font-semibold text-white">{template}</p>
                <p className="mt-2 text-sm text-slate-400">
                  Variáveis disponíveis: {"{nome}, {servico}, {data}, {hora}"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Políticas de cancelamento</CardTitle>
            <CardDescription>Resumo operacional por serviço ou fallback global.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Lash Lifting • 24h de antecedência • 100% de retenção abaixo de 12h",
              "Hidratação Premium • 12h de antecedência • crédito em carteira entre 6h e 12h",
              "Fallback global • 24h • reembolso total fora da janela crítica"
            ].map((item) => (
              <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4" key={item}>
                <p className="text-sm text-slate-300">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
