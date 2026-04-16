import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import { createAdminClient } from "../_shared/admin.ts";
import { corsHeaders } from "../_shared/cors.ts";

type WorkingWindow = {
  start: string;
  end: string;
};

const weekdayKeys = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
] as const;

function resolveWindow(workingHours: Record<string, unknown> | null, weekday: number): WorkingWindow {
  const value = workingHours?.[weekdayKeys[weekday]];
  if (
    value &&
    typeof value === "object" &&
    "start" in value &&
    "end" in value &&
    typeof value.start === "string" &&
    typeof value.end === "string"
  ) {
    return value;
  }

  return {
    start: "09:00",
    end: "18:00"
  };
}

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && startB < endA;
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { professional_id, service_id, date, organization_id } = await request.json();
    const admin = createAdminClient();

    const [{ data: professional }, { data: service }, { data: appointments }] = await Promise.all([
      admin
        .from("professionals")
        .select("working_hours, blocked_times")
        .eq("id", professional_id)
        .eq("organization_id", organization_id)
        .single(),
      admin
        .from("services")
        .select("duration_minutes")
        .eq("id", service_id)
        .eq("organization_id", organization_id)
        .single(),
      admin
        .from("appointments")
        .select("start_at, end_at")
        .eq("organization_id", organization_id)
        .eq("professional_id", professional_id)
        .in("status", ["confirmed", "pending_payment"])
        .gte("start_at", `${date}T00:00:00.000Z`)
        .lte("start_at", `${date}T23:59:59.999Z`)
    ]);

    const durationMinutes = Number(service?.duration_minutes ?? 60);
    const selectedDate = new Date(`${date}T00:00:00`);
    const window = resolveWindow(
      (professional?.working_hours as Record<string, unknown> | null) ?? null,
      selectedDate.getDay()
    );

    const [startHour, startMinute] = window.start.split(":").map(Number);
    const [endHour, endMinute] = window.end.split(":").map(Number);

    const dayStart = new Date(`${date}T00:00:00`);
    dayStart.setHours(startHour, startMinute, 0, 0);
    const dayEnd = new Date(`${date}T00:00:00`);
    dayEnd.setHours(endHour, endMinute, 0, 0);

    const blockedTimes = Array.isArray(professional?.blocked_times) ? professional?.blocked_times : [];
    const slotResults: Array<{ start_at: string; end_at: string; available: boolean }> = [];

    for (let slot = new Date(dayStart); slot < dayEnd; slot.setMinutes(slot.getMinutes() + 30)) {
      const slotStart = new Date(slot);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

      if (slotEnd > dayEnd) break;

      const hasAppointmentConflict = (appointments ?? []).some((appointment) =>
        overlaps(slotStart, slotEnd, new Date(appointment.start_at), new Date(appointment.end_at))
      );

      const hasBlockedConflict = blockedTimes.some((entry) => {
        if (!entry || typeof entry !== "object") return false;
        if (!("start_at" in entry) || !("end_at" in entry)) return false;
        return overlaps(
          slotStart,
          slotEnd,
          new Date(String(entry.start_at)),
          new Date(String(entry.end_at))
        );
      });

      slotResults.push({
        start_at: slotStart.toISOString(),
        end_at: slotEnd.toISOString(),
        available: !hasAppointmentConflict && !hasBlockedConflict
      });
    }

    return new Response(JSON.stringify(slotResults), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro ao calcular disponibilidade"
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
