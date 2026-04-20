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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useAppointments } from "@/lib/hooks/use-appointments";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import type { Appointment, Client, Professional, Service } from "@/types/skinnia";

function TimeCell({
  id,
  children,
  onCreate,
  hasContent
}: {
  id: string;
  children?: ReactNode;
  onCreate: () => void;
  hasContent?: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      className={cn(
        "min-h-[100px] rounded-xl p-2.5 text-left transition-all duration-200",
        "border",
        isOver
          ? "border-[var(--sk-brand-500)]/60 bg-[var(--sk-brand-500)]/8 shadow-inner"
          : hasContent
            ? "border-[var(--sk-border)] bg-[var(--sk-bg-card)]"
            : "border-[var(--sk-border)]/60 border-dashed bg-[var(--sk-bg-panel)]/60 hover:border-[var(--sk-border)] hover:bg-[var(--sk-bg-panel)]"
      )}
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
      {children ?? (
        <div className="h-full flex items-center justify-center">
          <span className="text-[10px] text-[var(--sk-text-muted)]">+</span>
        </div>
      )}
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
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--sk-brand-600)]">
                Agenda
              </p>
              <h3 className="font-display text-lg font-bold text-[var(--sk-text-primary)]">
                {viewMode === "week" ? "Visualização semanal" : "Visualização diária"}
              </h3>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={professionalFilter} onChange={(event) => setProfessionalFilter(event.target.value)}>
                <option value="all">Todos os profissionais</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.name}
                  </option>
                ))}
              </Select>
              <div className={cn(
                "flex gap-1 rounded-xl p-1",
                "bg-[var(--sk-bg-soft)] border border-[var(--sk-border)]"
              )}>
                <Button
                  onClick={() => setViewMode("week")}
                  size="sm"
                  variant={viewMode === "week" ? "default" : "ghost"}
                  className="text-xs px-3 h-8"
                >
                  Semana
                </Button>
                <Button
                  onClick={() => setViewMode("day")}
                  size="sm"
                  variant={viewMode === "day" ? "default" : "ghost"}
                  className="text-xs px-3 h-8"
                >
                  Dia
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="relative overflow-x-auto pb-4 scrollbar-thin">
            <DndContext onDragEnd={handleDragEnd}>
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `70px repeat(${days.length}, minmax(140px, 1fr))`,
                  minWidth: viewMode === "day" ? "auto" : "800px"
                }}
              >
              {/* Header row */}
              <div className="sticky left-0 z-10" />
              {days.map((day) => (
                <div
                  className={cn(
                    "rounded-xl border p-2 text-center sticky top-0",
                    "border-[var(--sk-border)] bg-[var(--sk-bg-card)]",
                    "shadow-[var(--sk-shadow-sm)]"
                  )}
                  key={day.toISOString()}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--sk-text-muted)]">
                    {format(day, "EEE", { locale: ptBR })}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-[var(--sk-text-primary)]">{format(day, "dd/MM")}</p>
                </div>
              ))}

              {/* Time slots */}
              {timeSlots.map((time) => (
                <div className="contents" key={time}>
                  <div className="sticky left-0 z-10 flex items-start justify-end pr-3 pt-3">
                    <span className="text-xs font-medium text-[var(--sk-text-muted)]">{time}</span>
                  </div>
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
                        hasContent={slotAppointments.length > 0}
                      >
                        <div className="space-y-1.5">
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
          </div>
        </CardContent>
      </Card>

      {/* Modals permanecem os mesmos - simplificados para foco */}
      <Modal
        description="Selecione cliente, serviço, profissional e revise o resumo antes de confirmar."
        onClose={() => setSelectedSlot(null)}
        open={Boolean(selectedSlot)}
        title="Novo agendamento"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--sk-text-secondary)]">Cliente</label>
            <Select value={clientId} onChange={(event) => setClientId(event.target.value)}>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--sk-text-secondary)]">Serviço</label>
            <Select value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--sk-text-secondary)]">Profissional</label>
            <Select value={professionalId} onChange={(event) => setProfessionalId(event.target.value)}>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--sk-text-secondary)]">Data e hora</label>
            <input
              className={cn(
                "flex h-10 w-full rounded-xl border px-3 py-2 text-sm",
                "border-[var(--sk-border)] bg-[var(--sk-bg-input)] text-[var(--sk-text-primary)]"
              )}
              onChange={(event) => setSelectedSlot(new Date(event.target.value).toISOString())}
              type="datetime-local"
              value={selectedSlot ? toDateTimeLocal(selectedSlot) : ""}
            />
          </div>
        </div>

        <div className={cn(
          "mt-4 rounded-2xl border p-3",
          "border-[var(--sk-border)] bg-[var(--sk-bg-panel)]"
        )}>
          <p className="text-xs font-medium text-[var(--sk-text-muted)]">Prévia do resumo</p>
          <p className="mt-1.5 text-sm font-semibold text-[var(--sk-text-primary)]">
            {clients.find((client) => client.id === clientId)?.name} •{" "}
            {services.find((service) => service.id === serviceId)?.name}
          </p>
          <p className="mt-1 text-xs text-[var(--sk-text-secondary)]">
            {selectedSlot ? formatDateTime(new Date(selectedSlot).toISOString()) : "Sem horário"}
          </p>
          <p className="text-xs text-[var(--sk-text-secondary)]">
            {formatCurrency(services.find((service) => service.id === serviceId)?.price ?? 0)}
          </p>
        </div>

        <label className={cn(
          "mt-3 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs",
          "border-[var(--sk-border)] bg-[var(--sk-bg-panel)] text-[var(--sk-text-secondary)]"
        )}>
          <input
            checked={chargeDeposit}
            className="h-4 w-4 rounded border-[var(--sk-border)]"
            onChange={(event) => setChargeDeposit(event.target.checked)}
            type="checkbox"
          />
          Cobrar sinal se o serviço exigir depósito
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={() => setSelectedSlot(null)} variant="ghost" size="sm">
            Cancelar
          </Button>
          <Button onClick={createAppointment} size="sm">Confirmar</Button>
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
          <div className="space-y-3">
            <div className={cn(
              "rounded-2xl border p-3",
              "border-[var(--sk-border)] bg-[var(--sk-bg-panel)]"
            )}>
              <p className="text-xs font-medium text-[var(--sk-text-muted)]">{selectedAppointment.service_name}</p>
              <p className="mt-1 text-lg font-bold text-[var(--sk-text-primary)]">
                {formatDateTime(selectedAppointment.start_at)}
              </p>
              <p className="mt-1 text-xs text-[var(--sk-text-secondary)]">
                {selectedAppointment.professional_name} • {formatCurrency(selectedAppointment.price)}
              </p>
            </div>

            <div className="grid gap-2">
              <Button
                onClick={() => {
                  updateStatus(selectedAppointment.id, "confirmed");
                  setSelectedAppointment(null);
                }}
                variant="secondary"
                size="sm"
              >
                Confirmar
              </Button>
              <Button
                onClick={() => {
                  updateStatus(selectedAppointment.id, "completed");
                  setSelectedAppointment(null);
                }}
                variant="secondary"
                size="sm"
              >
                Concluir
              </Button>
              <Button
                onClick={() => {
                  updateStatus(selectedAppointment.id, "no_show");
                  setSelectedAppointment(null);
                }}
                variant="outline"
                size="sm"
              >
                No-show
              </Button>
              <Button
                onClick={() => {
                  updateStatus(selectedAppointment.id, "cancelled");
                  setSelectedAppointment(null);
                }}
                variant="destructive"
                size="sm"
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
