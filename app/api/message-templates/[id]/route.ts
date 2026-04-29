import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

  const { data: existing } = await admin
    .from("message_templates")
    .select("id, organization_id")
    .eq("id", params.id)
    .eq("organization_id", ou.organization_id)
    .single();

  if (!existing) return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (typeof body.title === "string" && body.title.trim()) updates.title = body.title.trim();
  if (typeof body.body === "string" && body.body.trim()) updates.body = body.body.trim();

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("message_templates")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
