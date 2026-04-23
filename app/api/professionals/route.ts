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
    .select("organization_id, unit_id, role")
    .eq("user_id", user.id)
    .single();

  if (!ou) return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });

  const body = await request.json();
  const { name, phone, commission_pct, working_hours } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });

  const { data, error } = await admin
    .from("professionals")
    .insert({
      organization_id: ou.organization_id,
      unit_id: ou.unit_id,
      name: name.trim(),
      phone: phone?.trim() || null,
      commission_pct: commission_pct ? Number(commission_pct) : null,
      working_hours: working_hours ?? {},
      is_active: true
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
