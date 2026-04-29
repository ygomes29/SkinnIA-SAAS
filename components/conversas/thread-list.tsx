"use client";

import { useState } from "react";
import { Bot, MessageSquare, User, UserCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { formatRelativeDate } from "@/lib/utils/date";
import type { ConversationThread } from "@/types/skinnia";

type Thread = ConversationThread & { client_name?: string; last_message?: string };
type StatusFilter = "all" | "open" | "bot" | "human" | "resolved";

const STATUS_META: Record<
  ConversationThread["status"],
  { label: string; variant: "success" | "warning" | "neutral" | "danger" | "info" | "pink"; icon: typeof Bot }
> = {
  open: { label: "Aberto", variant: "warning", icon: MessageSquare },
  bot: { label: "Bot", variant: "info", icon: Bot },
  human: { label: "Humano", variant: "success", icon: UserCheck },
  resolved: { label: "Resolvido", variant: "neutral", icon: User },
};

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 13) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  return phone;
}

export function ThreadList({ initialThreads }: { initialThreads: Thread[] }) {
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filtered =
    filter === "all" ? initialThreads : initialThreads.filter((t) => t.status === filter);

  if (initialThreads.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center">
          <MessageSquare className="h-10 w-10 text-[var(--sk-text-muted)]" />
          <div>
            <p className="font-medium text-[var(--sk-text-primary)]">Sem conversas ainda</p>
            <p className="mt-1 max-w-sm text-sm text-[var(--sk-text-muted)]">
              As conversas aparecerão aqui assim que o WhatsApp estiver conectado via Evolution API.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>
            {initialThreads.length} conversa{initialThreads.length !== 1 ? "s" : ""}
          </CardTitle>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value as StatusFilter)}
            className="w-full sm:w-48"
          >
            <option value="all">Todos os status</option>
            <option value="open">Aberto</option>
            <option value="bot">Bot</option>
            <option value="human">Humano</option>
            <option value="resolved">Resolvido</option>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--sk-text-muted)]">
            Nenhuma conversa com este status.
          </p>
        ) : (
          filtered.map((thread) => {
            const meta = STATUS_META[thread.status];
            const Icon = meta.icon;

            return (
              <div
                key={thread.id}
                className={cn(
                  "flex items-start gap-4 rounded-2xl border p-4 transition-colors",
                  "border-[var(--sk-border)] bg-[var(--sk-bg-soft)]",
                  "hover:bg-[var(--sk-bg-card)]"
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  "bg-violet-500/10 border border-violet-500/20"
                )}>
                  <Icon className="h-5 w-5 text-violet-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-[var(--sk-text-primary)]">
                      {thread.client_name ?? formatPhone(thread.phone)}
                    </p>
                    <Badge variant={meta.variant} className="shrink-0 text-[10px]">
                      {meta.label}
                    </Badge>
                  </div>

                  {thread.client_name && (
                    <p className="text-xs text-[var(--sk-text-muted)]">
                      {formatPhone(thread.phone)}
                    </p>
                  )}

                  {thread.last_message && (
                    <p className="mt-1 truncate text-sm text-[var(--sk-text-secondary)]">
                      {thread.last_message}
                    </p>
                  )}

                  {thread.last_message_at && (
                    <p className="mt-1 text-xs text-[var(--sk-text-muted)]">
                      {formatRelativeDate(thread.last_message_at)}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
