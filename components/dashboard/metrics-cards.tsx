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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card
            className={cn(
              "overflow-hidden p-0 border-0",
              "shadow-[var(--sk-shadow-sm)] hover:shadow-[var(--sk-shadow-md)]",
              "transition-shadow duration-200"
            )}
            key={card.label}
          >
            <div className={cn(
              "relative h-full overflow-hidden rounded-2xl p-4",
              "border border-[var(--sk-border)]",
              "bg-[var(--sk-bg-card)]"
            )}>
              {/* Top accent line */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[var(--sk-brand-500)] via-[var(--sk-accent-400)] to-[var(--sk-brand-500)] opacity-60" />

              <div className="mb-4 flex items-start justify-between">
                <div className={cn(
                  "rounded-xl p-2.5",
                  "bg-gradient-to-br from-[var(--sk-brand-500)]/15 to-[var(--sk-brand-500)]/5",
                  "ring-1 ring-[var(--sk-brand-500)]/20"
                )}>
                  <Icon className="h-5 w-5 text-[var(--sk-brand-600)]" />
                </div>
                <Badge variant={card.badgeVariant} className="text-[10px] font-semibold">
                  {card.badge}
                </Badge>
              </div>

              <p className="text-xs font-medium text-[var(--sk-text-muted)] uppercase tracking-wide">
                {card.label}
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-[var(--sk-text-primary)] tracking-tight">
                {card.value}
              </p>
              <p className="mt-2 text-xs text-[var(--sk-text-secondary)] leading-relaxed">
                {card.detail}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
