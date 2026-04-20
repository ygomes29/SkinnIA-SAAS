import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function getOrgId(supabase: ReturnType<typeof createSupabaseServerClient>, admin: ReturnType<typeof createSupabaseAdminClient>, userId: string) {
  const { data } = await admin!
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", userId)
    .single();
  return data?.organization_id ?? null;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Configuração ausente" }, { status: 500 });

  const orgId = await getOrgId(supabase, admin, user.id);
  if (!orgId) return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });

  const body = await request.json();
  const { name, phone, email, birthdate, notes, tags, preferred_professional_id, status } = body;

  if (name !== undefined && !name?.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name.trim();
  if (phone !== undefined) updates.phone = phone.trim();
  if (email !== undefined) updates.email = email?.trim() || null;
  if (birthdate !== undefined) updates.birthdate = birthdate || null;
  if (notes !== undefined) updates.notes = notes?.trim() || null;
  if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : [];
  if (preferred_professional_id !== undefined) updates.preferred_professional_id = preferred_professional_id || null;
  if (status !== undefined) updates.status = status;

  const { data, error } = await admin
    .from("clients")
    .update(updates)
    .eq("id", params.id)
    .eq("organization_id", orgId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Configuração ausente" }, { status: 500 });

  const orgId = await getOrgId(supabase, admin, user.id);
  if (!orgId) return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });

  const { error } = await admin
    .from("clients")
    .update({ status: "blocked" })
    .eq("id", params.id)
    .eq("organization_id", orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
