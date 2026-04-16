import { Suspense } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { UpcomingAppointments } from "@/components/dashboard/upcoming-appointments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart } from "@/components/financeiro/revenue-chart";
import {
  getReactivationCandidates,
  getRevenueSeries,
  getTodayAppointments
} from "@/lib/dashboard-data";
import { formatRelativeDate } from "@/lib/utils/date";

export default async function DashboardPage() {
  const [appointments, revenue, reactivationClients] = await Promise.all([
    getTodayAppointments(),
    getRevenueSeries(),
    getReactivationCandidates()
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-violet-500/15 bg-gradient-to-r from-violet-500/[0.07] via-violet-500/[0.03] to-transparent p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[--sk-text-brand]">Dashboard principal</p>
            <h1 className="mt-3 font-display text-3xl font-semibold text-white">
              Operação, receita e relacionamento no mesmo lugar.
            </h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              O painel resume a saúde da agenda, os sinais capturados e os clientes prontos para
              receber campanhas de retorno.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary">
              <Sparkles className="mr-2 h-4 w-4" />
              Rodar campanha
            </Button>
            <Button>
              Abrir agenda
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="rounded-3xl border border-white/10 p-6">Carregando métricas...</div>}>
        <MetricsCards />
      </Suspense>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <UpcomingAppointments initialAppointments={appointments} />
        <RevenueChart data={revenue} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clientes retornando esta semana</CardTitle>
          <CardDescription>
            Janela ideal para reativação entre 25 e 35 dias sem atendimento.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {reactivationClients.slice(0, 4).map((client) => (
            <div
              className="rounded-3xl border border-violet-500/12 bg-[#0D1226]/60 p-4"
              key={client.id}
            >
              <p className="text-lg font-semibold text-white">{client.name}</p>
              <p className="mt-1 text-sm text-slate-400">{client.phone}</p>
              <p className="mt-4 text-sm text-slate-300">
                Último atendimento {formatRelativeDate(client.last_appointment_at)}
              </p>
              <Button className="mt-4 w-full" size="sm" variant="secondary">
                Enviar lembrete
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
