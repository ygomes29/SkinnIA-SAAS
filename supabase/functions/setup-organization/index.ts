import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import { createAdminClient } from "../_shared/admin.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, slug, owner_user_id, phone, city } = await request.json();
    const admin = createAdminClient();

    const { data: organization, error: organizationError } = await admin
      .from("organizations")
      .insert({
        name,
        slug,
        settings: {
          city,
          phone,
          agent_name: "Luna",
          tone: "premium",
          org_type: "studio"
        }
      })
      .select("id, slug")
      .single();

    if (organizationError || !organization) {
      throw new Error(organizationError?.message ?? "Falha ao criar organização");
    }

    const { data: unit, error: unitError } = await admin
      .from("units")
      .insert({
        organization_id: organization.id,
        name: `${name} Matriz`,
        city,
        phone
      })
      .select("id")
      .single();

    if (unitError || !unit) {
      throw new Error(unitError?.message ?? "Falha ao criar unidade inicial");
    }

    const { error: membershipError } = await admin.from("organization_users").insert({
      organization_id: organization.id,
      user_id: owner_user_id,
      unit_id: unit.id,
      role: "owner"
    });

    if (membershipError) {
      throw new Error(membershipError.message);
    }

    await admin.from("agent_configs").insert({
      organization_id: organization.id,
      agent_key: "atendimento",
      name: "Luna",
      tone: "premium",
      is_active: true,
      prompt_overrides: {
        handoff: "human",
        default_channel: "whatsapp"
      }
    });

    const n8nBase = Deno.env.get("N8N_WEBHOOK_BASE");
    const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000";

    if (n8nBase) {
      await fetch(`${n8nBase}/org-created`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          organization_id: organization.id,
          unit_id: unit.id,
          slug: organization.slug,
          phone
        })
      });
    }

    return new Response(
      JSON.stringify({
        organization_id: organization.id,
        unit_id: unit.id,
        onboarding_url: `${appUrl}/configuracoes?org=${organization.id}`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Falha no onboarding"
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
