"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { DndContext, type DragEndEvent, useDroppable } from "@dnd-kit/core";
import {
  addDays,
  addMinutes,
  format,
  parseISO,
  setHours,
  setMinutes,
  startOfWeek
} from "date-fns";
import { ptBR } from "date-fns/locale";

import { AppointmentCard } from "@/components/agenda/appointment-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useAppointments } from "@/lib/hooks/use-appointments";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDateTime } from "@/lib/utils/date";
import type { Appointment, Client, Professional, Service } from "@/types/skinnia";

function TimeCell({
  id,
  children,
  onCreate
}: {
  id: string;
  children?: ReactNode;
  onCreate: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      className={`min-h-[120px] rounded-3xl border border-dashed p-3 text-left transition ${
        isOver ? "border-pink-400/50 bg-pink-500/10" : "border-white/10 bg-white/[0.02]"
      }`}
      onClick={onCreate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onCreate();
        }
      }}
      ref={setNodeRef}
      role="button"
      tabIndex={0}
    >
      {children ?? <span className="text-xs text-slate-500">Clique para novo agendamento</span>}
    </div>
  );
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export function CalendarView({
  initialAppointments,
  clients,
  professionals,
  services
}: {
  initialAppointments: Appointment[];
  clients: Client[];
  professionals: Professional[];
  services: Service[];
}) {
  const { appointments, addAppointment, moveAppointment, updateStatus } =
    useAppointments(initialAppointments);
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [professionalFilter, setProfessionalFilter] = useState("all");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id ?? "");
  const [chargeDeposit, setChargeDeposit] = useState(true);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = viewMode === "day" ? [new Date()] : Array.from({ length: 6 }, (_, index) => addDays(weekStart, index));
  const timeSlots = Array.from({ length: 11 }, (_, index) => `${index + 9}:00`);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) =>
      professionalFilter === "all" ? true : appointment.professional_id === professionalFilter
    );
  }, [appointments, professionalFilter]);

  const appointmentsBySlot = useMemo(() => {
    const map = new Map<string, Appointment[]>();

    filteredAppointments.forEach((appointment) => {
      const date = parseISO(appointment.start_at);
      const key = `${format(date, "yyyy-MM-dd")}|${format(date, "HH:00")}`;
      const current = map.get(key) ?? [];
      current.push(appointment);
      map.set(key, current);
    });

    return map;
  }, [filteredAppointments]);

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over?.id;

    if (!overId) return;

    const [datePart, timePart] = String(overId).split("|");
    const duration = filteredAppointments.find((appointment) => appointment.id === activeId)
      ? services.find(
          (service) =>
            service.id === filteredAppointments.find((appointment) => appointment.id === activeId)?.service_id
        )?.duration_minutes ?? 60
      : 60;

    moveAppointment(activeId, `${datePart}T${timePart}:00.000Z`, duration);
  }

  async function createAppointment() {
    if (!selectedSlot || !clientId || !serviceId || !professionalId) return;

    const service = services.find((item) => item.id === serviceId);
    const client = clients.find((item) => item.id === clientId);
    const professional = professionals.find((item) => item.id === professionalId);

    if (!service || !client || !professional) return;

    const startAt = new Date(selectedSlot).toISOString();
    const endAt = addMinutes(new Date(selectedSlot), service.duration_minutes).toISOString();

    const result = await addAppointment({
      organization_id: client.organization_id,
      professional_id: professional.id,
      client_id: client.id,
      service_id: service.id,
      professional_name: professional.name,
      professional_avatar: professional.avatar_url ?? "",
      client_name: client.name,
      service_name: service.name,
      service_color: service.color ?? "#EC4899",
      start_at: startAt,
      end_at: endAt,
      price: service.price,
      status: chargeDeposit && service.deposit_required ? "pending_payment" : "confirmed",
      payment_status: chargeDeposit && service.deposit_required ? "pending" : "paid",
      confirmation_status: "pending",
      deposit_required: service.deposit_required,
      deposit_amount: service.deposit_amount ?? null,
      source: "panel"
    });

    if (result) {
      setSelectedSlot(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Agenda</CardTitle>
              <CardDescription>
                Visualização semanal e diária com drag-and-drop para remarcar.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select value={professionalFilter} onChange={(event) => setProfessionalFilter(event.target.value)}>
                <option value="all">Todos os profissionais</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.name}
                  </option>
                ))}
              </Select>
              <div className="flex gap-2">
                <Button
                  onClick={() => setViewMode("week")}
                  size="sm"
                  variant={viewMode === "week" ? "default" : "secondary"}
                >
                  Semana
                </Button>
                <Button
                  onClick={() => setViewMode("day")}
                  size="sm"
                  variant={viewMode === "day" ? "default" : "secondary"}
                >
                  Dia
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 overflow-x-auto">
          <DndContext onDragEnd={handleDragEnd}>
            <div className="grid min-w-[900px] gap-4" style={{ gridTemplateColumns: `120px repeat(${days.length}, minmax(180px, 1fr))` }}>
              <div />
              {days.map((day) => (
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-center" key={day.toISOString()}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {format(day, "EEE", { locale: ptBR })}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">{format(day, "dd/MM")}</p>
                </div>
              ))}

              {timeSlots.map((time) => (
                <div className="contents" key={time}>
                  <div className="flex items-start pt-4 text-sm text-slate-500">{time}</div>
                  {days.map((day) => {
                    const [hour] = time.split(":").map(Number);
                    const slotDate = setMinutes(setHours(day, hour), 0);
                    const slotKey = `${format(day, "yyyy-MM-dd")}|${time}`;
                    const slotAppointments = appointmentsBySlot.get(slotKey) ?? [];

                    return (
                      <TimeCell
                        id={slotKey}
                        key={slotKey}
                        onCreate={() => setSelectedSlot(slotDate.toISOString())}
                      >
                        <div className="space-y-2">
                          {slotAppointments.map((appointment) => (
                            <AppointmentCard
                              appointment={appointment}
                              key={appointment.id}
                              onOpen={setSelectedAppointment}
                            />
                          ))}
                        </div>
                      </TimeCell>
                    );
                  })}
                </div>
              ))}
            </div>
          </DndContext>
        </CardContent>
      </Card>

      <Modal
        description="Selecione cliente, serviço, profissional e revise o resumo antes de confirmar."
        onClose={() => setSelectedSlot(null)}
        open={Boolean(selectedSlot)}
        title="Novo agendamento"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Cliente</label>
            <Select value={clientId} onChange={(event) => setClientId(event.target.value)}>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} • {client.phone}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Serviço</label>
            <Select value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Profissional</label>
            <Select value={professionalId} onChange={(event) => setProfessionalId(event.target.value)}>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Data e hora</label>
            <input
              className="flex h-11 w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-2 text-sm text-slate-100"
              onChange={(event) => setSelectedSlot(new Date(event.target.value).toISOString())}
              type="datetime-local"
              value={selectedSlot ? toDateTimeLocal(selectedSlot) : ""}
            />
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/40 p-4">
          <p className="text-sm text-slate-400">Prévia do resumo</p>
          <p className="mt-2 font-semibold text-white">
            {clients.find((client) => client.id === clientId)?.name} •{" "}
            {services.find((service) => service.id === serviceId)?.name}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {selectedSlot ? formatDateTime(new Date(selectedSlot).toISOString()) : "Sem horário selecionado"}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            Valor {formatCurrency(services.find((service) => service.id === serviceId)?.price ?? 0)}
          </p>
        </div>

        <label className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
          <input
            checked={chargeDeposit}
            className="h-4 w-4 rounded border-white/10 bg-slate-950"
            onChange={(event) => setChargeDeposit(event.target.checked)}
            type="checkbox"
          />
          Cobrar sinal se o serviço exigir depósito
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={() => setSelectedSlot(null)} variant="ghost">
            Cancelar
          </Button>
          <Button onClick={createAppointment}>Confirmar agendamento</Button>
        </div>
      </Modal>

      <Modal
        align="right"
        description="Ações rápidas para confirmar, concluir, marcar no-show ou cancelar."
        onClose={() => setSelectedAppointment(null)}
        open={Boolean(selectedAppointment)}
        panelClassName="overflow-y-auto"
        title={selectedAppointment?.client_name ?? "Detalhes do agendamento"}
      >
        {selectedAppointment ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-slate-400">{selectedAppointment.service_name}</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {formatDateTime(selectedAppointment.start_at)}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Profissional: {selectedAppointment.professional_name}
              </p>
              <p className="text-sm text-slate-300">
                Valor: {formatCurrency(selectedAppointment.price)}
              </p>
            </div>

            <div className="grid gap-3">
              <Button
                onClick={() => {
                  updateStatus(selectedAppointment.id, "confirmed");
                  setSelectedAppointment(null);
                }}
                variant="secondary"
              >
                Confirmar manualmente
              </Button>
              <Button
                onClick={() => {
                  updateStatus(selectedAppointment.id, "completed");
                  setSelectedAppointment(null);
                }}
                variant="secondary"
              >
                Marcar como concluído
              </Button>
              <Button
                onClick={() => {
                  updateStatus(selectedAppointment.id, "no_show");
                  setSelectedAppointment(null);
                }}
                variant="outline"
              >
                Marcar como no-show
              </Button>
              <Button
                onClick={() => {
                  updateStatus(selectedAppointment.id, "cancelled");
                  setSelectedAppointment(null);
                }}
                variant="destructive"
              >
                Cancelar
              </Button>
              <Button variant="ghost">Enviar lembrete agora</Button>
              <Button variant="ghost">Ver conversa do WhatsApp</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
