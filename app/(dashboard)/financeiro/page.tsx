import { TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart } from "@/components/financeiro/revenue-chart";
import { getMetricsSummary, getRevenueSeries } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/utils/currency";

export default async function FinanceiroPage() {
  const [metrics, revenue] = await Promise.all([getMetricsSummary(), getRevenueSeries()]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-[--sk-text-brand]">Financeiro</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--sk-text-primary)]">Sinais, caixa e perdas operacionais</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Receita total</CardTitle>
            <CardDescription>Fechamento do dia corrente.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-[var(--sk-text-primary)]">{formatCurrency(metrics?.revenue_total ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sinais capturados</CardTitle>
            <CardDescription>Valor adiantado já garantido.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-[var(--sk-text-primary)]">
              {formatCurrency(metrics?.revenue_deposits ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Receita em risco</CardTitle>
            <CardDescription>No-shows e lacunas evitáveis.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-3xl font-semibold text-[var(--sk-text-primary)]">
              {formatCurrency(metrics?.revenue_lost_no_show ?? 0)}
            </p>
            <Badge variant="warning">
              <TrendingUp className="mr-1 h-3 w-3" />
              Monitorar
            </Badge>
          </CardContent>
        </Card>
      </div>

      <RevenueChart data={revenue} />
    </div>
  );
}
