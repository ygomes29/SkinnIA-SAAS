"use server";

import { revalidatePath } from "next/cache";
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

export type SettingsState = { error?: string; success?: string };

export async function saveOrgAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const ctx = await resolveOrg();
  if (!ctx) return { error: "Não autorizado" };

  const name = (formData.get("name") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  const timezone = (formData.get("timezone") as string)?.trim();
  const org_type = (formData.get("org_type") as string)?.trim();

  if (!name) return { error: "Nome é obrigatório" };

  const { data: current } = await ctx.admin
    .from("organizations")
    .select("settings")
    .eq("id", ctx.orgId)
    .single();

  const settings = {
    ...(current?.settings as Record<string, unknown> ?? {}),
    city,
    org_type
  };

  const { error } = await ctx.admin
    .from("organizations")
    .update({ name, timezone, settings })
    .eq("id", ctx.orgId);

  if (error) return { error: error.message };

  revalidatePath("/configuracoes");
  return { success: "Dados salvos com sucesso" };
}

export async function saveAgentAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const ctx = await resolveOrg();
  if (!ctx) return { error: "Não autorizado" };

  const agent_name = (formData.get("agent_name") as string)?.trim();
  const tone = (formData.get("tone") as string)?.trim();
  const prompt_base = (formData.get("prompt_base") as string)?.trim();

  const { error } = await ctx.admin
    .from("agent_configs")
    .upsert(
      {
        organization_id: ctx.orgId,
        agent_key: "atendimento",
        name: agent_name || "Luna",
        tone: tone || null,
        is_active: true,
        prompt_overrides: { prompt_base: prompt_base || null }
      },
      { onConflict: "organization_id,agent_key" }
    );

  if (error) return { error: error.message };

  const { data: org } = await ctx.admin
    .from("organizations")
    .select("settings")
    .eq("id", ctx.orgId)
    .single();

  await ctx.admin
    .from("organizations")
    .update({ settings: { ...(org?.settings as Record<string, unknown> ?? {}), agent_name } })
    .eq("id", ctx.orgId);

  revalidatePath("/configuracoes");
  return { success: "Agente atualizado" };
}
