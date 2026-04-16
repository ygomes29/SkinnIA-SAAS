import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Configuração ausente" }, { status: 500 });

  const { data: ou } = await admin
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!ou) return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });

  const body = await request.json();
  const { name, category, duration_minutes, price, deposit_required, deposit_amount, color } = body as Record<string, unknown>;

  if (!name) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  if (!duration_minutes || !price) return NextResponse.json({ error: "Duração e preço são obrigatórios" }, { status: 400 });

  const { data, error } = await admin
    .from("services")
    .insert({
      organization_id: ou.organization_id,
      name: String(name).trim(),
      category: category ? String(category).trim() || null : null,
      duration_minutes: Number(duration_minutes),
      price: Number(price),
      deposit_required: Boolean(deposit_required),
      deposit_amount: deposit_required && deposit_amount ? Number(deposit_amount) : null,
      color: color || "#EC4899",
      is_active: true
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
