"use client";

import { useMemo, useState } from "react";
import { Download, MessageCircleMore, Pencil, PlusCircle, Search, UserX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useClients } from "@/lib/hooks/use-clients";
import { formatCurrency } from "@/lib/utils/currency";
import { formatRelativeDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import type { Appointment, Client, Professional } from "@/types/skinnia";

type ClientDraft = {
  name: string;
  phone: string;
  email: string;
  birthdate: string;
  notes: string;
  tags: string;
  preferred_professional_id: string;
  status: "active" | "inactive" | "blocked";
};

const emptyDraft: ClientDraft = {
  name: "",
  phone: "",
  email: "",
  birthdate: "",
  notes: "",
  tags: "",
  preferred_professional_id: "",
  status: "active"
};

function favoriteProfessional(client: Client, appointments: Appointment[], professionals: Professional[]) {
  if (client.preferred_professional_id) {
    return professionals.find((p) => p.id === client.preferred_professional_id)?.name;
  }

  const counter = new Map<string, number>();
  appointments
    .filter((a) => a.client_id === client.id)
    .forEach((a) => {
      counter.set(a.professional_id, (counter.get(a.professional_id) ?? 0) + 1);
    });

  const winner = [...counter.entries()].sort((l, r) => r[1] - l[1])[0]?.[0];
  return professionals.find((p) => p.id === winner)?.name ?? "Sem preferência";
}

export function ClientTable({
  clients: initialClients,
  appointments,
  professionals
}: {
  clients: Client[];
  appointments: Appointment[];
  professionals: Professional[];
}) {
  const [clients, setClients] = useState(initialClients);
  const { filteredClients, professionalId, query, setProfessionalId, setQuery, setStatus, setTag, status, tag } =
    useClients(clients);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [draft, setDraft] = useState<ClientDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const allTags = useMemo(
    () => Array.from(new Set(clients.flatMap((c) => c.tags))).sort(),
    [clients]
  );

  function openCreate() {
    setEditing(null);
    setDraft(emptyDraft);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    setDraft({
      name: client.name,
      phone: client.phone,
      email: client.email ?? "",
      birthdate: client.birthdate ?? "",
      notes: client.notes ?? "",
      tags: client.tags.join(", "),
      preferred_professional_id: client.preferred_professional_id ?? "",
      status: client.status
    });
    setFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setDraft(emptyDraft);
    setFormError("");
  }

  function field(key: keyof ClientDraft) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setDraft((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function save() {
    if (!draft.name.trim()) { setFormError("Nome é obrigatório"); return; }
    if (!draft.phone.trim()) { setFormError("Telefone é obrigatório"); return; }

    setSaving(true);
    setFormError("");

    try {
      const url = editing ? `/api/clients/${editing.id}` : "/api/clients";
      const method = editing ? "PATCH" : "POST";
      const tags = draft.tags.split(",").map((t) => t.trim()).filter(Boolean);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          phone: draft.phone,
          email: draft.email || null,
          birthdate: draft.birthdate || null,
          notes: draft.notes || null,
          tags,
          preferred_professional_id: draft.preferred_professional_id || null,
          ...(editing ? { status: draft.status } : {})
        })
      });

      const json = await res.json();
      if (!res.ok) { setFormError(json.error ?? "Erro ao salvar"); return; }

      if (editing) {
        setClients((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...json } : c)));
      } else {
        setClients((prev) => [...prev, json]);
      }
      closeForm();
    } finally {
      setSaving(false);
    }
  }

  async function blockClient(client: Client) {
    const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    if (res.ok) {
      setClients((prev) => prev.map((c) => (c.id === client.id ? { ...c, status: "blocked" as const } : c)));
    }
  }

  function exportCsv() {
    const lines = [
      ["Nome", "Telefone", "Agendamentos", "LTV", "Último atendimento", "Status", "Tags"].join(","),
      ...filteredClients.map((c) =>
        [c.name, c.phone, c.total_appointments, c.ltv, c.last_appointment_at ?? "", c.status, c.tags.join("|")]
          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
          .join(",")
      )
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clientes-skinnia.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const clientAppointments = selectedClient
    ? appointments.filter((a) => a.client_id === selectedClient.id)
    : [];

  const serviceFrequency = clientAppointments.reduce<Record<string, number>>((acc, a) => {
    acc[a.service_name] = (acc[a.service_name] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 lg:grid-cols-[1.3fr_repeat(3,minmax(0,0.6fr))_auto_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sk-text-muted)]" />
              <Input
                className="pl-10"
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome ou telefone"
                value={query}
              />
            </label>
            <Select onChange={(e) => setStatus(e.target.value)} value={status}>
              <option value="all">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
              <option value="blocked">Bloqueados</option>
            </Select>
            <Select onChange={(e) => setTag(e.target.value)} value={tag}>
              <option value="all">Todas as tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
            <Select onChange={(e) => setProfessionalId(e.target.value)} value={professionalId}>
              <option value="all">Todos os profissionais</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
            <Button onClick={exportCsv} variant="secondary">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={openCreate}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo cliente
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-[var(--sk-text-muted)]">
                  <th className="px-4">Cliente</th>
                  <th className="px-4">Telefone</th>
                  <th className="px-4">Agendamentos</th>
                  <th className="px-4">LTV</th>
                  <th className="px-4">Último atendimento</th>
                  <th className="px-4">Status</th>
                  <th className="px-4">Tags</th>
                  <th className="px-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr
                    className={cn(
                      "rounded-3xl",
                      "bg-[var(--sk-bg-soft)]"
                    )}
                    key={client.id}
                  >
                    <td className="rounded-l-3xl px-4 py-4">
                      <div>
                        <p className="font-semibold text-[var(--sk-text-primary)]">{client.name}</p>
                        <p className="text-sm text-[var(--sk-text-muted)]">
                          Profissional favorita: {favoriteProfessional(client, appointments, professionals)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--sk-text-secondary)]">{client.phone}</td>
                    <td className="px-4 py-4 text-sm text-[var(--sk-text-secondary)]">{client.total_appointments}</td>
                    <td className="px-4 py-4 text-sm text-[var(--sk-text-secondary)]">{formatCurrency(client.ltv)}</td>
                    <td className="px-4 py-4 text-sm text-[var(--sk-text-secondary)]">
                      {formatRelativeDate(client.last_appointment_at)}
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        variant={
                          client.status === "active" ? "success" : client.status === "inactive" ? "warning" : "danger"
                        }
                      >
                        {client.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {client.tags.map((t) => (
                          <Badge key={t} variant="info">{t}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="rounded-r-3xl px-4 py-4">
                      <div className="flex gap-2">
                        <Button onClick={() => setSelectedClient(client)} size="sm" variant="secondary">
                          Ver perfil
                        </Button>
                        <Button onClick={() => openEdit(client)} size="sm" variant="ghost">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => blockClient(client)} size="sm" variant="ghost">
                          <MessageCircleMore className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredClients.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-center text-sm text-[var(--sk-text-muted)]" colSpan={8}>
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal criar / editar cliente */}
      <Modal
        description={editing ? "Edite os dados da cliente." : "Preencha os dados para cadastrar uma nova cliente."}
        onClose={closeForm}
        open={formOpen}
        title={editing ? "Editar cliente" : "Nova cliente"}
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-[var(--sk-text-muted)]">Nome *</label>
              <Input onChange={field("name")} placeholder="Nome completo" value={draft.name} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--sk-text-muted)]">Telefone / WhatsApp *</label>
              <Input onChange={field("phone")} placeholder="(11) 99999-9999" value={draft.phone} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--sk-text-muted)]">E-mail</label>
              <Input onChange={field("email")} placeholder="email@exemplo.com" type="email" value={draft.email} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--sk-text-muted)]">Data de nascimento</label>
              <Input onChange={field("birthdate")} type="date" value={draft.birthdate} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[var(--sk-text-muted)]">Profissional preferida</label>
            <Select onChange={field("preferred_professional_id")} value={draft.preferred_professional_id}>
              <option value="">Sem preferência</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[var(--sk-text-muted)]">Tags (separadas por vírgula)</label>
            <Input onChange={field("tags")} placeholder="vip, retorno, pele-sensível" value={draft.tags} />
          </div>

          {editing && (
            <div className="space-y-1">
              <label className="text-xs text-[var(--sk-text-muted)]">Status</label>
              <Select
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, status: e.target.value as ClientDraft["status"] }))
                }
                value={draft.status}
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="blocked">Bloqueado</option>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-[var(--sk-text-muted)]">Observações</label>
            <textarea
              className={cn(
                "w-full rounded-2xl border px-4 py-3 text-sm transition-all",
                "border-[var(--sk-border)] bg-[var(--sk-bg-input)]",
                "text-[var(--sk-text-primary)] placeholder:text-[var(--sk-text-muted)]",
                "focus:outline-none focus:ring-1 focus:ring-[var(--sk-brand-500)]"
              )}
              onChange={field("notes")}
              placeholder="Alergias, preferências, histórico relevante..."
              rows={3}
              value={draft.notes}
            />
          </div>

          {formError && <p className="text-sm text-[var(--sk-danger)]">{formError}</p>}

          <div className="flex justify-end gap-3">
            <Button onClick={closeForm} variant="secondary">Cancelar</Button>
            <Button disabled={saving} onClick={save}>
              {saving ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar cliente"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal perfil da cliente */}
      <Modal
        align="right"
        description="Histórico, preferências e atalhos de ação para relacionamento."
        onClose={() => setSelectedClient(null)}
        open={Boolean(selectedClient)}
        panelClassName="overflow-y-auto"
        title={selectedClient?.name ?? "Perfil da cliente"}
      >
        {selectedClient ? (
          <div className="space-y-5">
            <div className={cn(
              "rounded-3xl border p-4",
              "border-[var(--sk-border)] bg-[var(--sk-bg-panel)]"
            )}>
              <p className="text-sm text-[var(--sk-text-muted)]">{selectedClient.phone}</p>
              {selectedClient.email && (
                <p className="mt-1 text-sm text-[var(--sk-text-muted)]">{selectedClient.email}</p>
              )}
              <p className="mt-3 text-sm text-[var(--sk-text-secondary)]">
                Último atendimento {formatRelativeDate(selectedClient.last_appointment_at)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedClient.tags.map((t) => (
                  <Badge key={t} variant="pink">{t}</Badge>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="p-4">
                <p className="text-sm text-[var(--sk-text-muted)]">Histórico de agendamentos</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--sk-text-primary)]">{selectedClient.total_appointments}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-[var(--sk-text-muted)]">Créditos em carteira</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--sk-text-primary)]">R$ 0,00</p>
              </Card>
            </div>

            <div className={cn(
              "rounded-3xl border p-4",
              "border-[var(--sk-border)] bg-[var(--sk-bg-panel)]"
            )}>
              <p className="text-sm font-medium text-[var(--sk-text-primary)]">Serviços mais frequentes</p>
              <div className="mt-3 space-y-2">
                {Object.entries(serviceFrequency).map(([service, total]) => (
                  <div className="flex items-center justify-between" key={service}>
                    <span className="text-sm text-[var(--sk-text-secondary)]">{service}</span>
                    <span className="text-sm text-[var(--sk-text-muted)]">{total}x</span>
                  </div>
                ))}
                {Object.keys(serviceFrequency).length === 0 && (
                  <p className="text-sm text-[var(--sk-text-muted)]">Sem histórico suficiente.</p>
                )}
              </div>
            </div>

            <div className={cn(
              "rounded-3xl border p-4",
              "border-[var(--sk-border)] bg-[var(--sk-bg-panel)]"
            )}>
              <p className="text-sm font-medium text-[var(--sk-text-primary)]">Histórico completo</p>
              <div className="mt-3 space-y-3">
                {clientAppointments.map((a) => (
                  <div
                    className={cn(
                      "rounded-2xl border p-3",
                      "border-[var(--sk-border)] bg-[var(--sk-bg-card)]"
                    )}
                    key={a.id}
                  >
                    <p className="font-medium text-[var(--sk-text-primary)]">{a.service_name}</p>
                    <p className="text-sm text-[var(--sk-text-muted)]">
                      {formatRelativeDate(a.start_at)} • {a.professional_name}
                    </p>
                  </div>
                ))}
                {clientAppointments.length === 0 && (
                  <p className="text-sm text-[var(--sk-text-muted)]">Nenhum agendamento encontrado.</p>
                )}
              </div>
            </div>

            {selectedClient.notes && (
              <div className={cn(
                "rounded-3xl border p-4",
                "border-[var(--sk-border)] bg-[var(--sk-bg-panel)]"
              )}>
                <p className="text-sm font-medium text-[var(--sk-text-primary)]">Observações</p>
                <p className="mt-2 text-sm text-[var(--sk-text-muted)]">{selectedClient.notes}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => { setSelectedClient(null); openEdit(selectedClient); }}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar cliente
              </Button>
              <Button variant="secondary">
                <MessageCircleMore className="mr-2 h-4 w-4" />
                Enviar mensagem
              </Button>
              <Button
                onClick={() => { blockClient(selectedClient); setSelectedClient(null); }}
                variant="ghost"
              >
                <UserX className="mr-2 h-4 w-4" />
                Bloquear
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
