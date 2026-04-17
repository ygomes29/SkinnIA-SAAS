import { redirect } from "next/navigation";

import { getOnboardingStatus } from "../actions";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const { data: status, error } = await getOnboardingStatus();

  if (error || !status) {
    redirect("/login");
  }

  if (status.isComplete) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-violet to-brand-cyan text-3xl font-bold text-white shadow-brand">
          S
        </div>
        <h1 className="text-3xl font-semibold text-white">Bem-vindo ao SkinnIA</h1>
        <p className="mt-3 text-[--sk-text-secondary]">
          Vamos configurar sua clínica em poucos passos
        </p>

        {/* Progress */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="h-2 w-48 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-violet to-brand-cyan transition-all"
              style={{ width: `${status.progressPercent}%` }}
            />
          </div>
          <span className="text-sm text-[--sk-text-muted]">
            {status.completedSteps} de {status.totalSteps}
          </span>
        </div>
      </div>

      {/* Form */}
      <OnboardingForm
        currentStep={status.currentStep}
        steps={status.steps}
      />
    </div>
  );
}
