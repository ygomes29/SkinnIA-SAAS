"use client";

import { useMemo, useState } from "react";
import { Download, MessageCircleMore, PlusCircle, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useClients } from "@/lib/hooks/use-clients";
import { formatCurrency } from "@/lib/utils/currency";
import { formatRelativeDate } from "@/lib/utils/date";
import type { Appointment, Client, Professional } from "@/types/skinnia";

function favoriteProfessional(client: Client, appointments: Appointment[], professionals: Professional[]) {
  if (client.preferred_professional_id) {
    return professionals.find((professional) => professional.id === client.preferred_professional_id)?.name;
  }

  const counter = new Map<string, number>();
  appointments
    .filter((appointment) => appointment.client_id === client.id)
    .forEach((appointment) => {
      counter.set(appointment.professional_id, (counter.get(appointment.professional_id) ?? 0) + 1);
    });

  const winner = [...counter.entries()].sort((left, right) => right[1] - left[1])[0]?.[0];
  return professionals.find((professional) => professional.id === winner)?.name ?? "Sem preferência";
}

export function ClientTable({
  clients,
  appointments,
  professionals
}: {
  clients: Client[];
  appointments: Appointment[];
  professionals: Professional[];
}) {
  const { filteredClients, professionalId, query, setProfessionalId, setQuery, setStatus, setTag, status, tag } =
    useClients(clients);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const allTags = useMemo(
    () => Array.from(new Set(clients.flatMap((client) => client.tags))).sort(),
    [clients]
  );

  function exportCsv() {
    const lines = [
      ["Nome", "Telefone", "Agendamentos", "LTV", "Último atendimento", "Status", "Tags"].join(","),
      ...filteredClients.map((client) =>
        [
          client.name,
          client.phone,
          client.total_appointments,
          client.ltv,
          client.last_appointment_at ?? "",
          client.status,
          client.tags.join("|")
        ]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(",")
      )
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "clientes-skinnia.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const clientAppointments = selectedClient
    ? appointments.filter((appointment) => appointment.client_id === selectedClient.id)
    : [];

  const serviceFrequency = clientAppointments.reduce<Record<string, number>>((accumulator, appointment) => {
    accumulator[appointment.service_name] = (accumulator[appointment.service_name] ?? 0) + 1;
    return accumulator;
  }, {});

  return (
    <>
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 lg:grid-cols-[1.3fr_repeat(3,minmax(0,0.6fr))_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                className="pl-10"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nome ou telefone"
                value={query}
              />
            </label>
            <Select onChange={(event) => setStatus(event.target.value)} value={status}>
              <option value="all">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
              <option value="blocked">Bloqueados</option>
            </Select>
            <Select onChange={(event) => setTag(event.target.value)} value={tag}>
              <option value="all">Todas as tags</option>
              {allTags.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
            <Select onChange={(event) => setProfessionalId(event.target.value)} value={professionalId}>
              <option value="all">Todos os profissionais</option>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.name}
                </option>
              ))}
            </Select>
            <Button onClick={exportCsv} variant="secondary">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
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
                  <tr className="rounded-3xl bg-white/[0.03]" key={client.id}>
                    <td className="rounded-l-3xl px-4 py-4">
                      <div>
                        <p className="font-semibold text-white">{client.name}</p>
                        <p className="text-sm text-slate-500">
                          Profissional favorita: {favoriteProfessional(client, appointments, professionals)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">{client.phone}</td>
                    <td className="px-4 py-4 text-sm text-slate-300">{client.total_appointments}</td>
                    <td className="px-4 py-4 text-sm text-slate-300">{formatCurrency(client.ltv)}</td>
                    <td className="px-4 py-4 text-sm text-slate-300">
                      {formatRelativeDate(client.last_appointment_at)}
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        variant={
                          client.status === "active"
                            ? "success"
                            : client.status === "inactive"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {client.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {client.tags.map((item) => (
                          <Badge key={item} variant="info">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="rounded-r-3xl px-4 py-4">
                      <div className="flex gap-2">
                        <Button onClick={() => setSelectedClient(client)} size="sm" variant="secondary">
                          Ver perfil
                        </Button>
                        <Button size="sm" variant="ghost">
                          <MessageCircleMore className="mr-2 h-4 w-4" />
                          Mensagem
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-slate-400">{selectedClient.phone}</p>
              <p className="mt-3 text-sm text-slate-300">
                Último atendimento {formatRelativeDate(selectedClient.last_appointment_at)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedClient.tags.map((item) => (
                  <Badge key={item} variant="pink">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="p-4">
                <p className="text-sm text-slate-400">Histórico de agendamentos</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {selectedClient.total_appointments}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-slate-400">Créditos em carteira</p>
                <p className="mt-2 text-3xl font-semibold text-white">R$ 0,00</p>
              </Card>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-medium text-white">Serviços mais frequentes</p>
              <div className="mt-3 space-y-2">
                {Object.entries(serviceFrequency).map(([service, total]) => (
                  <div className="flex items-center justify-between" key={service}>
                    <span className="text-sm text-slate-300">{service}</span>
                    <span className="text-sm text-slate-400">{total}x</span>
                  </div>
                ))}
                {Object.keys(serviceFrequency).length === 0 ? (
                  <p className="text-sm text-slate-500">Sem histórico suficiente.</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-medium text-white">Histórico completo</p>
              <div className="mt-3 space-y-3">
                {clientAppointments.map((appointment) => (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3" key={appointment.id}>
                    <p className="font-medium text-white">{appointment.service_name}</p>
                    <p className="text-sm text-slate-400">
                      {formatRelativeDate(appointment.start_at)} • {appointment.professional_name}
                    </p>
                  </div>
                ))}
                {clientAppointments.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum agendamento recente encontrado.</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-medium text-white">Resumo de conversas</p>
              <p className="mt-2 text-sm text-slate-400">
                Preferência por confirmação via WhatsApp, responde melhor no período da tarde e já
                aceitou cobrança por Pix.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Agendar agora
              </Button>
              <Button variant="secondary">Enviar campanha de retorno</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
