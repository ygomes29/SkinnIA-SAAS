"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import type { Service } from "@/types/skinnia";

const COLORS = ["#EC4899", "#8B5CF6", "#14B8A6", "#F59E0B", "#3B82F6", "#EF4444"];

type ServiceDraft = {
  name: string;
  category: string;
  duration_minutes: string;
  price: string;
  deposit_required: boolean;
  deposit_amount: string;
  color: string;
};

const empty: ServiceDraft = {
  name: "",
  category: "",
  duration_minutes: "60",
  price: "",
  deposit_required: false,
  deposit_amount: "",
  color: "#EC4899"
};

export function ServicesManager({ initial }: { initial: Service[] }) {
  const [services, setServices] = useState(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [draft, setDraft] = useState<ServiceDraft>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openCreate() {
    setEditing(null);
    setDraft(empty);
    setError("");
    setOpen(true);
  }

  function openEdit(s: Service) {
    setEditing(s);
    setDraft({
      name: s.name,
      category: s.category ?? "",
      duration_minutes: s.duration_minutes.toString(),
      price: s.price.toString(),
      deposit_required: s.deposit_required,
      deposit_amount: s.deposit_amount?.toString() ?? "",
      color: s.color ?? "#EC4899"
    });
    setError("");
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setEditing(null);
    setDraft(empty);
    setError("");
  }

  async function save() {
    setError("");
    if (!draft.name.trim()) { setError("Nome é obrigatório"); return; }
    if (!draft.price) { setError("Preço é obrigatório"); return; }
    if (!draft.duration_minutes) { setError("Duração é obrigatória"); return; }

    setLoading(true);
    try {
      const url = editing ? `/api/services/${editing.id}` : "/api/services";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          category: draft.category,
          duration_minutes: Number(draft.duration_minutes),
          price: Number(draft.price),
          deposit_required: draft.deposit_required,
          deposit_amount: draft.deposit_required && draft.deposit_amount ? Number(draft.deposit_amount) : null,
          color: draft.color
        })
      });

      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Erro ao salvar"); return; }

      if (editing) {
        setServices((prev) => prev.map((s) => (s.id === editing.id ? { ...s, ...json } : s)));
      } else {
        setServices((prev) => [...prev, json]);
      }
      close();
    } finally {
      setLoading(false);
    }
  }

  async function deactivate(s: Service) {
    if (!confirm(`Desativar "${s.name}"?`)) return;
    const res = await fetch(`/api/services/${s.id}`, { method: "DELETE" });
    if (res.ok) {
      setServices((prev) => prev.filter((x) => x.id !== s.id));
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Catálogo de serviços</CardTitle>
              <CardDescription>Base para agenda, cobrança de sinal e políticas.</CardDescription>
            </div>
            <Button onClick={openCreate} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Novo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {services.length === 0 ? (
            <p className="text-sm text-[var(--sk-text-muted)]">Nenhum serviço cadastrado.</p>
          ) : (
            services.map((s) => (
              <div
                className="flex items-center justify-between rounded-3xl border border-[var(--sk-border)] bg-[var(--sk-bg-soft)] p-4"
                key={s.id}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: s.color ?? "#EC4899" }}
                  />
                  <div>
                    <p className="font-semibold text-[var(--sk-text-primary)]">{s.name}</p>
                    <p className="text-sm text-[var(--sk-text-muted)]">{s.duration_minutes} min</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-[var(--sk-text-primary)]">{formatCurrency(s.price)}</p>
                    <p className="text-xs text-[var(--sk-text-muted)]">
                      {s.deposit_required ? `Sinal ${formatCurrency(s.deposit_amount ?? 0)}` : "Confirmação direta"}
                    </p>
                  </div>
                  <button
                    className="rounded-xl border border-[var(--sk-border)] p-2 text-[var(--sk-text-muted)] transition hover:bg-[var(--sk-bg-hover)] hover:text-[var(--sk-text-primary)]"
                    onClick={() => openEdit(s)}
                    title="Editar"
                    type="button"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded-xl border border-[var(--sk-border)] p-2 text-[var(--sk-text-muted)] transition hover:bg-red-500/10 hover:text-red-400"
                    onClick={() => deactivate(s)}
                    title="Desativar"
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Modal
        description="Defina nome, duração, preço e política de sinal."
        onClose={close}
        open={open}
        title={editing ? "Editar serviço" : "Novo serviço"}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm text-[var(--sk-text-secondary)]">Nome *</label>
            <Input
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Ex: Lash Lifting"
              value={draft.name}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[var(--sk-text-secondary)]">Categoria</label>
            <Input
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              placeholder="Ex: lash, cabelo"
              value={draft.category}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[var(--sk-text-secondary)]">Duração (min) *</label>
            <Input
              min="5"
              onChange={(e) => setDraft((d) => ({ ...d, duration_minutes: e.target.value }))}
              type="number"
              value={draft.duration_minutes}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[var(--sk-text-secondary)]">Preço (R$) *</label>
            <Input
              min="0"
              onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
              placeholder="Ex: 180"
              step="0.01"
              type="number"
              value={draft.price}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[var(--sk-text-secondary)]">Cor</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  className="h-7 w-7 rounded-full border-2 transition"
                  key={c}
                  onClick={() => setDraft((d) => ({ ...d, color: c }))}
                  style={{
                    backgroundColor: c,
                    borderColor: draft.color === c ? "white" : "transparent"
                  }}
                  type="button"
                />
              ))}
            </div>
          </div>

          <div className="space-y-3 sm:col-span-2">
            <label className="flex items-center gap-3 rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-bg-soft)] px-4 py-3 text-sm text-[var(--sk-text-secondary)]">
              <input
                checked={draft.deposit_required}
                className="h-4 w-4 rounded border-[var(--sk-border)] bg-[var(--sk-bg-input)]"
                onChange={(e) => setDraft((d) => ({ ...d, deposit_required: e.target.checked }))}
                type="checkbox"
              />
              Exige sinal para confirmar
            </label>
            {draft.deposit_required ? (
              <div className="space-y-2">
                <label className="text-sm text-[var(--sk-text-secondary)]">Valor do sinal (R$)</label>
                <Input
                  min="0"
                  onChange={(e) => setDraft((d) => ({ ...d, deposit_amount: e.target.value }))}
                  placeholder="Ex: 50"
                  step="0.01"
                  type="number"
                  value={draft.deposit_amount}
                />
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={close} variant="ghost">Cancelar</Button>
          <Button disabled={loading} onClick={save}>
            {loading ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
