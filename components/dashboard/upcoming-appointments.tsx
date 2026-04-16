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

    const channel = client
      .channel("appointments-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments"
        },
        () => {
          void client
            .from("appointments")
            .select(
              "id, organization_id, professional_id, client_id, service_id, unit_id, start_at, end_at, price, status, payment_status, confirmation_status, deposit_required, deposit_amount, source"
            )
            .order("start_at", { ascending: true })
            .then(({ data }) => {
              if (!data?.length) return;

              setAppointments((current) =>
                data.map((row, index) => current[index] ?? current[0]).filter(Boolean)
              );
            });
        }
      )
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
