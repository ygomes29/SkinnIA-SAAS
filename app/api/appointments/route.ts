import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  professional_id: z.string().uuid(),
  client_id: z.string().uuid(),
  service_id: z.string().uuid(),
  unit_id: z.string().uuid().optional(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  price: z.number().positive(),
  deposit_required: z.boolean().default(false),
  deposit_amount: z.number().nullable().optional(),
  source: z.enum(["whatsapp", "panel", "site", "link", "api"]).default("panel"),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  const serverClient = createSupabaseServerClient();
  if (!serverClient) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  }

  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Resolve organization_id from the authenticated user
  const { data: orgUser, error: orgUserError } = await serverClient
    .from("organization_users")
    .select("organization_id, unit_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (orgUserError || !orgUser) {
    return NextResponse.json({ error: "Organização não encontrada para este usuário." }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Admin client não disponível." }, { status: 503 });
  }

  const { data, error } = await admin
    .from("appointments")
    .insert({
      organization_id: orgUser.organization_id,
      unit_id: parsed.data.unit_id ?? orgUser.unit_id,
      professional_id: parsed.data.professional_id,
      client_id: parsed.data.client_id,
      service_id: parsed.data.service_id,
      start_at: parsed.data.start_at,
      end_at: parsed.data.end_at,
      price: parsed.data.price,
      deposit_required: parsed.data.deposit_required,
      deposit_amount: parsed.data.deposit_amount,
      source: parsed.data.source,
      notes: parsed.data.notes,
      status: parsed.data.deposit_required ? "pending_payment" : "confirmed",
      payment_status: parsed.data.deposit_required ? "pending" : "paid",
    })
    .select(
      `
      id, organization_id, unit_id, professional_id, client_id, service_id,
      start_at, end_at, price, status, payment_status, confirmation_status,
      deposit_required, deposit_amount, source,
      professionals ( name, avatar_url ),
      clients ( name ),
      services ( name, color )
    `
    )
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }

  return NextResponse.json({ success: true, appointment: data }, { status: 201 });
}
