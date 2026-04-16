"use client";

import { useMemo, useState, useCallback } from "react";
import { addMinutes } from "date-fns";

import type { Appointment } from "@/types/skinnia";

export function useAppointments(initialAppointments: Appointment[]) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [saving, setSaving] = useState(false);

  const sortedAppointments = useMemo(
    () =>
      [...appointments].sort(
        (left, right) => new Date(left.start_at).getTime() - new Date(right.start_at).getTime()
      ),
    [appointments]
  );

  const updateStatus = useCallback(async (id: string, status: Appointment["status"]) => {
    // Optimistic update
    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === id
          ? {
              ...appointment,
              status,
              confirmation_status:
                status === "confirmed" ? "confirmed" : appointment.confirmation_status,
            }
          : appointment
      )
    );

    // Skip API for draft appointments (not yet persisted)
    if (id.startsWith("draft-")) return;

    try {
      const response = await fetch(`/api/appointments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        // Revert on failure
        setAppointments((current) =>
          current.map((appointment) =>
            appointment.id === id
              ? { ...appointment, status: appointment.status }
              : appointment
          )
        );
        console.error("Erro ao atualizar status:", await response.text());
      }
    } catch (error) {
      console.error("Erro de rede ao atualizar status:", error);
    }
  }, []);

  const moveAppointment = useCallback(async (id: string, startAt: string, durationMinutes: number) => {
    const endAt = addMinutes(new Date(startAt), durationMinutes).toISOString();

    // Optimistic update
    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === id
          ? { ...appointment, start_at: startAt, end_at: endAt }
          : appointment
      )
    );

    // Skip API for draft appointments
    if (id.startsWith("draft-")) return;

    try {
      const response = await fetch(`/api/appointments/${id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start_at: startAt, end_at: endAt }),
      });

      if (!response.ok) {
        console.error("Erro ao remarcar agendamento:", await response.text());
      }
    } catch (error) {
      console.error("Erro de rede ao remarcar:", error);
    }
  }, []);

  const addAppointment = useCallback(
    async (draft: Omit<Appointment, "id"> & { id?: string }): Promise<Appointment | null> => {
      const tempId = `draft-${Date.now()}`;
      const optimistic: Appointment = { ...draft, id: tempId } as Appointment;

      setSaving(true);
      setAppointments((current) => [...current, optimistic]);

      try {
        const response = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            professional_id: draft.professional_id,
            client_id: draft.client_id,
            service_id: draft.service_id,
            unit_id: draft.unit_id,
            start_at: draft.start_at,
            end_at: draft.end_at,
            price: draft.price,
            deposit_required: draft.deposit_required,
            deposit_amount: draft.deposit_amount,
            source: draft.source,
          }),
        });

        if (response.ok) {
          const { appointment: saved } = await response.json();
          const merged: Appointment = {
            ...optimistic,
            id: saved.id,
            status: saved.status,
            payment_status: saved.payment_status,
            professional_name: saved.professionals?.name ?? draft.professional_name,
            professional_avatar: saved.professionals?.avatar_url ?? draft.professional_avatar,
            client_name: saved.clients?.name ?? draft.client_name,
            service_name: saved.services?.name ?? draft.service_name,
            service_color: saved.services?.color ?? draft.service_color,
          };
          // Replace draft with saved version
          setAppointments((current) =>
            current.map((appointment) => (appointment.id === tempId ? merged : appointment))
          );
          return merged;
        } else {
          console.error("Erro ao criar agendamento:", await response.text());
          // Remove failed draft
          setAppointments((current) => current.filter((a) => a.id !== tempId));
          return null;
        }
      } catch (error) {
        console.error("Erro de rede ao criar agendamento:", error);
        setAppointments((current) => current.filter((a) => a.id !== tempId));
        return null;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  return {
    appointments: sortedAppointments,
    addAppointment,
    moveAppointment,
    updateStatus,
    saving,
  };
}
