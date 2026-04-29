"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, Clock3, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { formatRelativeDate } from "@/lib/utils/date";
import type { AutomationRun } from "@/types/skinnia";
import { cn } from "@/lib/utils/cn";

type StatusFilter = "all" | "success" | "error" | "running" | "skipped";

function statusIcon(status: AutomationRun["status"]) {
  if (status === "success") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (status === "error") return <XCircle className="h-4 w-4 text-rose-400" />;
  return <Clock3 className="h-4 w-4 text-amber-300" />;
}

function statusVariant(status: AutomationRun["status"]) {
  if (status === "success") return "success" as const;
  if (status === "error") return "danger" as const;
  return "warning" as const;
}

function JsonBlock({ label, data }: { label: string; data: Record<string, unknown> | null | undefined }) {
  const [open, setOpen] = useState(false);
  if (!data || Object.keys(data).length === 0) return null;

  return (
    <div className="mt-2">
      <button
        className="flex items-center gap-1 text-xs text-[var(--sk-text-muted)] hover:text-[var(--sk-text-secondary)] transition-colors"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {label}
      </button>
      {open && (
        <pre className={cn(
          "mt-2 rounded-xl p-3 text-[11px] leading-relaxed overflow-x-auto",
          "bg-[var(--sk-bg-panel)] text-[var(--sk-text-secondary)] border border-[var(--sk-border)]"
        )}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function LogsTable({ runs }: { runs: AutomationRun[] }) {
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filtered = filter === "all" ? runs : runs.filter((r) => r.status === filter);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Execuções recentes</CardTitle>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value as StatusFilter)}
            className="w-full sm:w-48"
          >
            <option value="all">Todos os status</option>
            <option value="success">Sucesso</option>
            <option value="error">Erro</option>
            <option value="running">Em execução</option>
            <option value="skipped">Ignorado</option>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-center">
            <CheckCircle2 className="h-8 w-8 text-[var(--sk-text-muted)]" />
            <p className="text-sm text-[var(--sk-text-muted)]">
              {filter === "all" ? "Nenhuma execução registrada ainda." : `Nenhuma execução com status "${filter}".`}
            </p>
          </div>
        ) : (
          filtered.map((run) => (
            <div
              className={cn(
                "rounded-3xl border p-4",
                "border-[var(--sk-border)] bg-[var(--sk-bg-soft)]"
              )}
              key={run.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{statusIcon(run.status)}</div>
                  <div>
                    <p className="font-semibold text-[var(--sk-text-primary)]">{run.workflow_name}</p>
                    <p className="mt-0.5 text-xs text-[var(--sk-text-muted)]">
                      {run.trigger_type ?? "interno"}
                      {run.duration_ms != null ? ` • ${run.duration_ms} ms` : ""}
                    </p>
                    {run.error && (
                      <p className="mt-1.5 rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-400">
                        {run.error}
                      </p>
                    )}
                    <JsonBlock label="Ver input" data={run.input} />
                    <JsonBlock label="Ver output" data={run.output} />
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:flex-shrink-0">
                  <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
                  <span className="whitespace-nowrap text-xs text-[var(--sk-text-muted)]">
                    {formatRelativeDate(run.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
