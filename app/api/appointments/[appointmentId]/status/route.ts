import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveOrgContext } from "@/lib/api/resolve-org";

const bodySchema = z.object({
  status: z.enum(["draft", "pending_payment", "confirmed", "cancelled", "completed", "no_show", "refunded"]),
  reason: z.string().max(500).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { appointmentId: string } }
) {
  const { ctx, err } = await resolveOrgContext();
  if (err) return err;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const timestamps: Record<string, string> = {};
  if (parsed.data.status === "completed") timestamps.completed_at = new Date().toISOString();
  if (parsed.data.status === "cancelled") timestamps.cancelled_at = new Date().toISOString();
  if (parsed.data.status === "no_show") timestamps.no_show_at = new Date().toISOString();
  if (parsed.data.status === "confirmed") timestamps.confirmed_at = new Date().toISOString();

  const { data, error } = await ctx.admin
    .from("appointments")
    .update({
      status: parsed.data.status,
      cancellation_reason: parsed.data.reason ?? null,
      ...timestamps,
    })
    .eq("id", params.appointmentId)
    .eq("organization_id", ctx.orgId)
    .select("id, status")
    .single();

  if (error) return NextResponse.json({ error: "Falha ao atualizar agendamento" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });

  return NextResponse.json({ success: true, appointment: data });
}
