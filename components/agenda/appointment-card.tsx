"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { formatTime } from "@/lib/utils/date";
import type { Appointment } from "@/types/skinnia";

export function AppointmentCard({
  appointment,
  onOpen
}: {
  appointment: Appointment;
  onOpen: (appointment: Appointment) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: appointment.id
  });

  return (
    <button
      className={cn(
        "w-full rounded-2xl border p-3 text-left shadow-sm transition-all duration-200",
        "border-[var(--sk-border)] bg-[var(--sk-bg-panel)]",
        "hover:border-[var(--sk-border-strong)] hover:bg-[var(--sk-bg-card-hover)]",
        isDragging && "opacity-50"
      )}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(appointment);
      }}
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform)
      }}
      type="button"
      {...listeners}
      {...attributes}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span
          className="inline-flex h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: appointment.service_color }}
        />
        <Badge variant={appointment.status === "confirmed" ? "success" : "warning"}>
          {appointment.status}
        </Badge>
      </div>
      <p className="font-semibold text-[var(--sk-text-primary)]">{appointment.client_name}</p>
      <p className="mt-1 text-sm text-[var(--sk-text-secondary)]">{appointment.service_name}</p>
      <p className="mt-2 text-xs text-[var(--sk-text-muted)]">
        {formatTime(appointment.start_at)} • {appointment.professional_name}
      </p>
    </button>
  );
}
