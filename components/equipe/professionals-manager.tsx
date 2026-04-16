"use client";

import { useState } from "react";
import { Plus, Pencil, UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Professional } from "@/types/skinnia";

type ProfessionalDraft = {
  name: string;
  phone: string;
  commission_pct: string;
};

const empty: ProfessionalDraft = { name: "", phone: "", commission_pct: "" };

export function ProfessionalsManager({ initial }: { initial: Professional[] }) {
  const [professionals, setProfessionals] = useState(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Professional | null>(null);
  const [draft, setDraft] = useState<ProfessionalDraft>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openCreate() {
    setEditing(null);
    setDraft(empty);
    setError("");
    setOpen(true);
  }

  function openEdit(p: Professional) {
    setEditing(p);
    setDraft({
      name: p.name,
      phone: p.phone ?? "",
      commission_pct: p.commission_pct?.toString() ?? ""
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

    setLoading(true);
    try {
      const url = editing ? `/api/professionals/${editing.id}` : "/api/professionals";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          phone: draft.phone,
          commission_pct: draft.commission_pct ? Number(draft.commission_pct) : null
        })
      });

      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Erro ao salvar"); return; }

      if (editing) {
        setProfessionals((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...json } : p)));
      } else {
        setProfessionals((prev) => [...prev, json]);
      }
      close();
    } finally {
      setLoading(false);
    }
  }

  async function deactivate(p: Professional) {
    if (!confirm(`Desativar ${p.name}?`)) return;
    const res = await fetch(`/api/professionals/${p.id}`, { method: "DELETE" });
    if (res.ok) {
      setProfessionals((prev) => prev.filter((x) => x.id !== p.id));
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profissionais ativos</CardTitle>
              <CardDescription>Distribuição atual da equipe por atendimento.</CardDescription>
            </div>
            <Button onClick={openCreate} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Novo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {professionals.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum profissional cadastrado.</p>
          ) : (
            professionals.map((p) => (
              <div
                className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/40 p-4"
                key={p.id}
              >
                <div>
                  <p className="font-semibold text-white">{p.name}</p>
                  <p className="text-sm text-slate-400">{p.phone ?? "Sem telefone"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-300">
                    Comissão {p.commission_pct ?? 0}%
                  </span>
                  <button
                    className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                    onClick={() => openEdit(p)}
                    title="Editar"
                    type="button"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
                    onClick={() => deactivate(p)}
                    title="Desativar"
                    type="button"
                  >
                    <UserX className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Modal
        description="Dados do profissional e configuração de comissão."
        onClose={close}
        open={open}
        title={editing ? "Editar profissional" : "Novo profissional"}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Nome *</label>
            <Input
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Ex: Ana Beatriz"
              value={draft.name}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Telefone</label>
            <Input
              onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
              placeholder="+55 31 99999-0000"
              value={draft.phone}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Comissão (%)</label>
            <Input
              max="100"
              min="0"
              onChange={(e) => setDraft((d) => ({ ...d, commission_pct: e.target.value }))}
              placeholder="Ex: 12"
              type="number"
              value={draft.commission_pct}
            />
          </div>

          {error ? (
            <p className="rounded-2xl bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <Button onClick={close} variant="ghost">Cancelar</Button>
            <Button disabled={loading} onClick={save}>
              {loading ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
