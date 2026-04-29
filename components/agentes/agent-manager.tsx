"use client";

import { useState } from "react";
import { Zap, ZapOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import type { AgentConfig } from "@/types/skinnia";

const AGENT_LABELS: Record<string, { label: string; description: string }> = {
  atendimento: {
    label: "Atendimento",
    description: "Responde dúvidas gerais e encaminha para fluxos específicos.",
  },
  agendamento: {
    label: "Agendamento",
    description: "Coleta serviço, data e profissional para criar pré-reserva.",
  },
  financeiro: {
    label: "Financeiro",
    description: "Gerencia cobranças de sinal e confirmação de pagamentos.",
  },
  cancelamento: {
    label: "Cancelamento",
    description: "Processa pedidos de cancelamento e aplica políticas.",
  },
  reativacao: {
    label: "Reativação",
    description: "Campanha automática para clientes inativos há mais de 30 dias.",
  },
  pos_atendimento: {
    label: "Pós-atendimento",
    description: "Coleta NPS, incentiva avaliações e sugere rebooking.",
  },
};

interface EditState {
  name: string;
  tone: string;
  prompt_base: string;
}

export function AgentManager({ initialAgents }: { initialAgents: AgentConfig[] }) {
  const [agents, setAgents] = useState(initialAgents);
  const [editing, setEditing] = useState<AgentConfig | null>(null);
  const [editForm, setEditForm] = useState<EditState>({ name: "", tone: "", prompt_base: "" });
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleAgent(agent: AgentConfig) {
    setSaving(agent.id);
    setError(null);

    // Optimistic update
    setAgents((prev) =>
      prev.map((a) => (a.id === agent.id ? { ...a, is_active: !a.is_active } : a))
    );

    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !agent.is_active }),
      });

      if (!res.ok) {
        // Revert
        setAgents((prev) =>
          prev.map((a) => (a.id === agent.id ? { ...a, is_active: agent.is_active } : a))
        );
        setError("Erro ao atualizar agente.");
      }
    } catch {
      setAgents((prev) =>
        prev.map((a) => (a.id === agent.id ? { ...a, is_active: agent.is_active } : a))
      );
      setError("Erro de rede.");
    } finally {
      setSaving(null);
    }
  }

  function openEdit(agent: AgentConfig) {
    const overrides = (agent.prompt_overrides ?? {}) as Record<string, string>;
    setEditForm({
      name: agent.name,
      tone: agent.tone ?? "",
      prompt_base: overrides.prompt_base ?? "",
    });
    setEditing(agent);
    setError(null);
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(editing.id);
    setError(null);

    try {
      const res = await fetch(`/api/agents/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          tone: editForm.tone,
          prompt_overrides: { prompt_base: editForm.prompt_base },
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setAgents((prev) => prev.map((a) => (a.id === editing.id ? updated : a)));
        setEditing(null);
      } else {
        setError("Erro ao salvar alterações.");
      }
    } catch {
      setError("Erro de rede.");
    } finally {
      setSaving(null);
    }
  }

  if (agents.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center">
          <ZapOff className="h-8 w-8 text-[var(--sk-text-muted)]" />
          <p className="text-sm text-[var(--sk-text-muted)]">
            Nenhum agente configurado. Complete o onboarding para ativar os agentes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {error && (
        <p className="rounded-2xl bg-rose-500/10 px-4 py-2 text-sm text-rose-400">{error}</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => {
          const meta = AGENT_LABELS[agent.agent_key];
          return (
            <Card key={agent.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">
                      {meta?.label ?? agent.agent_key}
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs">
                      {meta?.description ?? agent.name}
                    </CardDescription>
                  </div>
                  <Badge variant={agent.is_active ? "success" : "warning"} className="shrink-0">
                    {agent.is_active ? "Ativo" : "Pausado"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <div className={cn(
                  "rounded-2xl border p-3",
                  "border-[var(--sk-border)] bg-[var(--sk-bg-panel)]"
                )}>
                  <p className="text-xs text-[var(--sk-text-muted)]">Nome</p>
                  <p className="mt-0.5 text-sm font-medium text-[var(--sk-text-primary)]">{agent.name}</p>
                  {agent.tone && (
                    <>
                      <p className="mt-2 text-xs text-[var(--sk-text-muted)]">Tom</p>
                      <p className="mt-0.5 text-xs text-[var(--sk-text-secondary)]">{agent.tone}</p>
                    </>
                  )}
                </div>

                <div className="mt-auto flex items-center gap-2">
                  <Button
                    className="flex-1"
                    disabled={saving === agent.id}
                    onClick={() => toggleAgent(agent)}
                    size="sm"
                    variant={agent.is_active ? "outline" : "secondary"}
                  >
                    {agent.is_active ? (
                      <><ZapOff className="mr-1.5 h-3.5 w-3.5" />Pausar</>
                    ) : (
                      <><Zap className="mr-1.5 h-3.5 w-3.5" />Ativar</>
                    )}
                  </Button>
                  <Button
                    onClick={() => openEdit(agent)}
                    size="sm"
                    variant="ghost"
                  >
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Modal
        description="Personalize o nome, tom de voz e instruções base deste agente."
        onClose={() => setEditing(null)}
        open={Boolean(editing)}
        title={`Editar agente — ${editing ? (AGENT_LABELS[editing.agent_key]?.label ?? editing.agent_key) : ""}`}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--sk-text-secondary)]">
              Nome do agente
            </label>
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Luna"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--sk-text-secondary)]">
              Tom de voz
            </label>
            <Input
              value={editForm.tone}
              onChange={(e) => setEditForm((f) => ({ ...f, tone: e.target.value }))}
              placeholder="Ex: acolhedor e objetivo"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--sk-text-secondary)]">
              Prompt base
            </label>
            <Textarea
              value={editForm.prompt_base}
              onChange={(e) => setEditForm((f) => ({ ...f, prompt_base: e.target.value }))}
              placeholder="Instruções adicionais para este agente…"
              rows={4}
            />
          </div>

          {error && (
            <p className="rounded-2xl bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button onClick={() => setEditing(null)} variant="ghost" size="sm">
              Cancelar
            </Button>
            <Button
              disabled={saving === editing?.id}
              onClick={saveEdit}
              size="sm"
            >
              {saving === editing?.id ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
