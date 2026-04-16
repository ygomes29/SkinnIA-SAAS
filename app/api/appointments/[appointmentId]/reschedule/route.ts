import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { appointmentId: string } }
) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Admin client não disponível." }, { status: 503 });
  }

  const { data, error } = await admin
    .from("appointments")
    .update({
      start_at: parsed.data.start_at,
      end_at: parsed.data.end_at,
    })
    .eq("id", params.appointmentId)
    .select("id, start_at, end_at, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, appointment: data });
}
