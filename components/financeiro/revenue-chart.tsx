"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import { formatShortDate } from "@/lib/utils/date";
import type { MetricDaily } from "@/types/skinnia";

export function RevenueChart({ data }: { data: MetricDaily[] }) {
  const chartData = data.map((item) => ({
    ...item,
    label: formatShortDate(item.date),
    receita: item.revenue_total,
    sinais: item.revenue_deposits
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Receita dos últimos 7 dias</CardTitle>
        <CardDescription>Visão rápida do caixa capturado por dia.</CardDescription>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis
              axisLine={false}
              dataKey="label"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickFormatter={(value) => `R$ ${value}`}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(15,23,42,0.95)",
                color: "#fff"
              }}
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
            />
            <Bar dataKey="receita" fill="#EC4899" radius={[12, 12, 4, 4]} />
            <Bar dataKey="sinais" fill="#8B5CF6" radius={[12, 12, 4, 4]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
