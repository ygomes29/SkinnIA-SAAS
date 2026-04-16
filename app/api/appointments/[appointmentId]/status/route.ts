import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  status: z.enum([
    "draft",
    "pending_payment",
    "confirmed",
    "cancelled",
    "completed",
    "no_show",
    "refunded"
  ]),
  reason: z.string().optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: { appointmentId: string } }
) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({
      success: true,
      mocked: true,
      appointment_id: params.appointmentId,
      ...parsed.data
    });
  }

  const timestamps: Record<string, string> = {};
  if (parsed.data.status === "completed") timestamps.completed_at = new Date().toISOString();
  if (parsed.data.status === "cancelled") timestamps.cancelled_at = new Date().toISOString();
  if (parsed.data.status === "no_show") timestamps.no_show_at = new Date().toISOString();
  if (parsed.data.status === "confirmed") timestamps.confirmed_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("appointments")
    .update({
      status: parsed.data.status,
      cancellation_reason: parsed.data.reason ?? null,
      ...timestamps
    })
    .eq("id", params.appointmentId)
    .select("id, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, appointment: data });
}
