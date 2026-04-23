import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveOrgContext } from "@/lib/api/resolve-org";

const bodySchema = z.object({
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
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

  const { data, error } = await ctx.admin
    .from("appointments")
    .update({ start_at: parsed.data.start_at, end_at: parsed.data.end_at })
    .eq("id", params.appointmentId)
    .eq("organization_id", ctx.orgId)
    .select("id, start_at, end_at, status")
    .single();

  if (error) return NextResponse.json({ error: "Falha ao reagendar" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });

  return NextResponse.json({ success: true, appointment: data });
}
