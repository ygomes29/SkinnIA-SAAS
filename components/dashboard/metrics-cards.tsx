import { CalendarDays, CircleAlert, Coins, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getMetricsSummary } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";

export async function MetricsCards() {
  const metrics = await getMetricsSummary();

  const cards = [
    {
      label: "Agendamentos do dia",
      value: metrics?.appointments_total ?? 0,
      detail: `${metrics?.appointments_confirmed ?? 0} confirmados • ${
        (metrics?.appointments_total ?? 0) - (metrics?.appointments_confirmed ?? 0)
      } pendentes`,
      icon: CalendarDays,
      badge: "Tempo real",
      badgeVariant: "info" as const
    },
    {
      label: "Receita do dia",
      value: formatCurrency(metrics?.revenue_total ?? 0),
      detail: `${formatCurrency(metrics?.revenue_deposits ?? 0)} em sinais capturados`,
      icon: Coins,
      badge: "Financeiro",
      badgeVariant: "success" as const
    },
    {
      label: "No-shows",
      value: metrics?.appointments_no_show ?? 0,
      detail: `${formatCurrency(metrics?.revenue_lost_no_show ?? 0)} em receita perdida`,
      icon: CircleAlert,
      badge: "Atenção",
      badgeVariant: "warning" as const
    },
    {
      label: "Taxa de confirmação",
      value: `${Math.round(
        ((metrics?.appointments_confirmed ?? 0) / Math.max(metrics?.appointments_total ?? 1, 1)) * 100
      )}%`,
      detail: `${metrics?.appointments_completed ?? 0} atendimentos concluídos hoje`,
      icon: ShieldCheck,
      badge: "Estável",
      badgeVariant: "pink" as const
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card className="overflow-hidden p-0" key={card.label}>
            <div className={cn(
              "relative h-full overflow-hidden rounded-[28px] p-5",
              "border border-[var(--sk-border)]",
              "bg-[var(--sk-bg-card)]",
              "bg-gradient-to-br from-[var(--sk-brand-500)]/[0.06] to-transparent"
            )}>
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--sk-brand-500)]/30 to-transparent" />
              <div className="mb-6 flex items-start justify-between">
                <div className={cn(
                  "rounded-2xl p-3",
                  "bg-[var(--sk-brand-500)]/15"
                )}>
                  <Icon className="h-5 w-5 text-brand-cyan" />
                </div>
                <Badge variant={card.badgeVariant}>{card.badge}</Badge>
              </div>
              <p className="text-sm text-[var(--sk-text-muted)]">{card.label}</p>
              <p className="mt-2 font-display text-3xl font-semibold text-[var(--sk-text-primary)]">{card.value}</p>
              <p className="mt-3 text-sm text-[var(--sk-text-secondary)]">{card.detail}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
