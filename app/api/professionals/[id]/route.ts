import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function resolveOrg() {
  const supabase = createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: ou } = await admin
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();
  if (!ou) return null;
  return { admin, orgId: ou.organization_id as string };
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await resolveOrg();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { name, phone, commission_pct, working_hours, is_active } = body;

  const patch: Record<string, unknown> = {};
  if (name !== undefined) patch.name = name.trim();
  if (phone !== undefined) patch.phone = phone?.trim() || null;
  if (commission_pct !== undefined) patch.commission_pct = commission_pct ? Number(commission_pct) : null;
  if (working_hours !== undefined) patch.working_hours = working_hours;
  if (is_active !== undefined) patch.is_active = is_active;

  const { data, error } = await ctx.admin
    .from("professionals")
    .update(patch)
    .eq("id", params.id)
    .eq("organization_id", ctx.orgId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await resolveOrg();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { error } = await ctx.admin
    .from("professionals")
    .update({ is_active: false })
    .eq("id", params.id)
    .eq("organization_id", ctx.orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
