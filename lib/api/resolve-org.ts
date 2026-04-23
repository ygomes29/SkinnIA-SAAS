import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;
type OrgCtx = { orgId: string; admin: AdminClient };
type Result = { ctx: OrgCtx; err: null } | { ctx: null; err: NextResponse };

export async function resolveOrgContext(): Promise<Result> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { ctx: null, err: NextResponse.json({ error: "Não autorizado" }, { status: 401 }) };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ctx: null, err: NextResponse.json({ error: "Não autorizado" }, { status: 401 }) };

  const admin = createSupabaseAdminClient();
  if (!admin) return { ctx: null, err: NextResponse.json({ error: "Serviço indisponível" }, { status: 503 }) };

  const { data: ou } = await admin
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!ou) return { ctx: null, err: NextResponse.json({ error: "Organização não encontrada" }, { status: 403 }) };

  return { ctx: { orgId: ou.organization_id as string, admin }, err: null };
}
