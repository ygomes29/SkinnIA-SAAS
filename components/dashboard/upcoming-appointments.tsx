"use client";

import { useEffect, useState } from "react";
import { CheckCheck, CircleX, MessageCircleMore } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { formatTime } from "@/lib/utils/date";
import type { Appointment } from "@/types/skinnia";

function statusVariant(status: Appointment["status"]) {
  switch (status) {
    case "confirmed":
      return "success";
    case "pending_payment":
      return "warning";
    case "cancelled":
    case "no_show":
      return "danger";
    case "completed":
      return "pink";
    default:
      return "info";
  }
}

export function UpcomingAppointments({
  initialAppointments
}: {
  initialAppointments: Appointment[];
}) {
  const [appointments, setAppointments] = useState(initialAppointments);

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (!client) return;

    const today = new Date().toISOString().slice(0, 10);

    function refetch() {
      void client!
        .from("appointments")
        .select(`
          id, organization_id, unit_id, professional_id, client_id, service_id,
          start_at, end_at, price, status, payment_status, confirmation_status,
          deposit_required, deposit_amount, source,
          professionals ( name, avatar_url ),
          clients ( name ),
          services ( name, color )
        `)
        .gte("start_at", `${today}T00:00:00.000Z`)
        .lte("start_at", `${today}T23:59:59.999Z`)
        .order("start_at", { ascending: true })
        .then(({ data }) => {
          if (!data) return;
          setAppointments(
            data.map((row) => {
              const prof = row.professionals as { name?: string; avatar_url?: string } | null;
              const cl = row.clients as { name?: string } | null;
              const svc = row.services as { name?: string; color?: string } | null;
              return {
                ...row,
                professional_name: prof?.name ?? "Profissional",
                professional_avatar: prof?.avatar_url ?? "",
                client_name: cl?.name ?? "Cliente",
                service_name: svc?.name ?? "Serviço",
                service_color: svc?.color ?? "#EC4899"
              } as Appointment;
            })
          );
        });
    }

    const channel = client
      .channel("appointments-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, refetch)
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Agenda de hoje</CardTitle>
            <CardDescription>Atualização em tempo real com ações rápidas da operação.</CardDescription>
          </div>
          <Badge variant="info">{appointments.length} horários</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {appointments.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">Nenhum agendamento para hoje.</p>
        )}
        {appointments.map((appointment) => (
          <div
            className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/30 p-4 md:flex-row md:items-center md:justify-between"
            key={appointment.id}
          >
            <div className="flex items-center gap-4">
              <div
                className="h-14 w-1 rounded-full"
                style={{ backgroundColor: appointment.service_color }}
              />
              <Avatar name={appointment.professional_name} imageUrl={appointment.professional_avatar} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-semibold text-white">{appointment.client_name}</h4>
                  <Badge variant={statusVariant(appointment.status)}>{appointment.status}</Badge>
                </div>
                <p className="text-sm text-slate-300">
                  {appointment.service_name} com {appointment.professional_name}
                </p>
                <p className="text-xs text-slate-500">
                  {formatTime(appointment.start_at)} às {formatTime(appointment.end_at)} •{" "}
                  {formatCurrency(appointment.price)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary">
                <CheckCheck className="mr-2 h-4 w-4" />
                Concluir
              </Button>
              <Button size="sm" variant="outline">
                <CircleX className="mr-2 h-4 w-4" />
                No-show
              </Button>
              <Button size="sm" variant="ghost">
                <MessageCircleMore className="mr-2 h-4 w-4" />
                Conversa
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
