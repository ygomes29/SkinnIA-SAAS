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
  const { name, phone, email, birthdate, notes, tags, preferred_professional_id } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  if (!phone?.trim()) return NextResponse.json({ error: "Telefone é obrigatório" }, { status: 400 });

  const { data, error } = await admin
    .from("clients")
    .insert({
      organization_id: ou.organization_id,
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || null,
      birthdate: birthdate || null,
      notes: notes?.trim() || null,
      tags: Array.isArray(tags) ? tags : [],
      preferred_professional_id: preferred_professional_id || null,
      status: "active",
      total_appointments: 0,
      total_spent: 0,
      ltv: 0
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
