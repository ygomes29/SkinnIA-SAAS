"use client";

import { cn } from "@/lib/utils/cn";
import type { OnboardingStep, OnboardingStatus } from "@/types/skinnia";

interface StepperProps {
  steps: { step: OnboardingStep; status: OnboardingStatus }[];
  currentStep: OnboardingStep;
}

const stepLabels: Record<OnboardingStep, { label: string; description: string }> = {
  business_data: { label: "Dados da empresa", description: "Informações básicas do negócio" },
  working_hours: { label: "Horários", description: "Configure o funcionamento" },
  team: { label: "Equipe", description: "Adicione profissionais" },
  services: { label: "Serviços", description: "Cadastre seus serviços" },
  whatsapp: { label: "WhatsApp", description: "Conecte o WhatsApp" },
  agent: { label: "Agente IA", description: "Configure o assistente" },
  review: { label: "Revisão", description: "Revise e finalize" }
};

export function Stepper({ steps, currentStep }: StepperProps) {
  const currentIndex = steps.findIndex((s) => s.step === currentStep);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.status === "completed";
          const isCurrent = step.step === currentStep;
          const isPending = step.status === "pending" || step.status === "in_progress";

          return (
            <div key={step.step} className="flex items-center">
              {/* Step circle */}
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all",
                  isCompleted
                    ? "bg-brand-violet text-white"
                    : isCurrent
                      ? "bg-brand-violet/20 text-brand-violet ring-2 ring-brand-violet"
                      : "bg-white/5 text-[--sk-text-muted]"
                )}
              >
                {isCompleted ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M5 13l4 4L19 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* Step label - only show for current and adjacent */}
              {(isCurrent || isCompleted || index === currentIndex + 1) && (
                <div className="ml-3 hidden md:block">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCurrent ? "text-white" : "text-[--sk-text-muted]"
                    )}
                  >
                    {stepLabels[step.step].label}
                  </p>
                </div>
              )}

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "ml-4 mr-4 h-0.5 w-12 transition-colors",
                    isCompleted ? "bg-brand-violet" : "bg-white/10"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StepHeader({ step }: { step: OnboardingStep }) {
  const { label, description } = stepLabels[step];

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-white">{label}</h2>
      <p className="mt-2 text-[--sk-text-secondary]">{description}</p>
    </div>
  );
}

export { stepLabels };
