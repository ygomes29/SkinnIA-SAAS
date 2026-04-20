"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { OnboardingStep, OnboardingStatus } from "@/types/skinnia";

interface OnboardingResult {
  error?: string;
  success?: string;
}

export async function saveOnboardingStep(
  step: OnboardingStep,
  status: OnboardingStatus,
  payload: Record<string, unknown>
): Promise<OnboardingResult> {
  const supabase = createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  if (!supabase || !admin) return { error: "Configuração ausente" };

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Usuário não autenticado" };
  }

  // Get user's organization
  const { data: orgUser } = await admin
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!orgUser) {
    return { error: "Organização não encontrada" };
  }

  const completedAt = status === "completed" ? new Date().toISOString() : null;

  const { error } = await admin.from("onboarding_progress").upsert(
    {
      tenant_id: orgUser.organization_id,
      step,
      status,
      payload,
      completed_at: completedAt,
      updated_at: new Date().toISOString()
    },
    {
      onConflict: "tenant_id,step"
    }
  );

  if (error) {
    console.error("Error saving onboarding step:", error);
    return { error: "Erro ao salvar progresso" };
  }

  revalidatePath("/onboarding");
  return { success: "Progresso salvo" };
}

export async function getOnboardingStatus(): Promise<{
  data?: {
    totalSteps: number;
    completedSteps: number;
    currentStep: OnboardingStep | null;
    isComplete: boolean;
    progressPercent: number;
    steps: { step: OnboardingStep; status: OnboardingStatus }[];
  };
  error?: string;
}> {
  const supabase = createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  if (!supabase || !admin) return { error: "Configuração ausente" };

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Usuário não autenticado" };
  }

  // Get user's organization
  const { data: orgUser } = await admin
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!orgUser) {
    return { error: "Organização não encontrada" };
  }

  const { data: progress } = await admin
    .from("onboarding_progress")
    .select("step, status")
    .eq("tenant_id", orgUser.organization_id)
    .order("created_at", { ascending: true });

  const allSteps: OnboardingStep[] = [
    "business_data",
    "working_hours",
    "team",
    "services",
    "whatsapp",
    "agent",
    "review"
  ];

  const stepsMap = new Map(progress?.map((p) => [p.step, p.status]) ?? []);

  const steps = allSteps.map((step) => ({
    step,
    status: (stepsMap.get(step) ?? "pending") as OnboardingStatus
  }));

  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const currentStep =
    steps.find((s) => s.status === "in_progress")?.step ??
    steps.find((s) => s.status === "pending")?.step ??
    null;

  return {
    data: {
      totalSteps: allSteps.length,
      completedSteps,
      currentStep,
      isComplete: completedSteps >= allSteps.length,
      progressPercent: Math.round((completedSteps / allSteps.length) * 100),
      steps
    }
  };
}

export async function completeOnboarding(): Promise<OnboardingResult> {
  const result = await saveOnboardingStep("review", "completed", {});
  return result;
}
