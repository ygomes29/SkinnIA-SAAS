"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Stepper, StepHeader, stepLabels } from "@/components/onboarding/stepper";
import { saveOnboardingStep, completeOnboarding } from "../actions";
import type { OnboardingStep, OnboardingStatus } from "@/types/skinnia";

interface OnboardingFormProps {
  currentStep: OnboardingStep | null;
  steps: { step: OnboardingStep; status: OnboardingStatus }[];
}

export function OnboardingForm({ currentStep, steps }: OnboardingFormProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState<OnboardingStep>(currentStep ?? "business_data");
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [businessData, setBusinessData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    category: "clinic"
  });

  const [workingHours, setWorkingHours] = useState({
    monday: { open: "09:00", close: "18:00", closed: false },
    tuesday: { open: "09:00", close: "18:00", closed: false },
    wednesday: { open: "09:00", close: "18:00", closed: false },
    thursday: { open: "09:00", close: "18:00", closed: false },
    friday: { open: "09:00", close: "18:00", closed: false },
    saturday: { open: "09:00", close: "14:00", closed: false },
    sunday: { open: "09:00", close: "18:00", closed: true }
  });

  const [teamMembers, setTeamMembers] = useState([{ name: "", phone: "", role: "professional" }]);
  const [services, setServices] = useState([{ name: "", duration: 60, price: 0 }]);
  const [whatsapp, setWhatsapp] = useState({ instanceName: "", connected: false });
  const [agentConfig, setAgentConfig] = useState({ name: "SkinnIA", tone: "professional" });

  const activeStepIndex = steps.findIndex((s) => s.step === activeStep);

  async function handleNext() {
    setIsLoading(true);

    // Save current step
    let payload = {};
    switch (activeStep) {
      case "business_data":
        payload = businessData;
        break;
      case "working_hours":
        payload = workingHours;
        break;
      case "team":
        payload = { members: teamMembers };
        break;
      case "services":
        payload = { services };
        break;
      case "whatsapp":
        payload = whatsapp;
        break;
      case "agent":
        payload = agentConfig;
        break;
    }

    await saveOnboardingStep(activeStep, "completed", payload);

    // Move to next step
    const nextIndex = activeStepIndex + 1;
    if (nextIndex < steps.length) {
      const nextStep = steps[nextIndex].step;
      await saveOnboardingStep(nextStep, "in_progress", {});
      setActiveStep(nextStep);
    }

    setIsLoading(false);
  }

  async function handleComplete() {
    setIsLoading(true);
    await completeOnboarding();
    router.push("/");
    setIsLoading(false);
  }

  async function handleSkip() {
    await saveOnboardingStep(activeStep, "skipped", {});
    const nextIndex = activeStepIndex + 1;
    if (nextIndex < steps.length) {
      setActiveStep(steps[nextIndex].step);
    }
  }

  function renderStepContent() {
    switch (activeStep) {
      case "business_data":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-[--sk-text-secondary]">Nome da empresa</label>
              <Input
                placeholder="Clínica de Estética Exemplo"
                value={businessData.name}
                onChange={(e) => setBusinessData({ ...businessData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-[--sk-text-secondary]">Telefone</label>
              <Input
                placeholder="(11) 99999-9999"
                value={businessData.phone}
                onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-[--sk-text-secondary]">Endereço</label>
              <Input
                placeholder="Rua Exemplo, 123"
                value={businessData.address}
                onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-[--sk-text-secondary]">Cidade</label>
              <Input
                placeholder="São Paulo"
                value={businessData.city}
                onChange={(e) => setBusinessData({ ...businessData, city: e.target.value })}
              />
            </div>
          </div>
        );

      case "working_hours":
        return (
          <div className="space-y-3">
            {Object.entries(workingHours).map(([day, hours]) => (
              <div key={day} className="flex items-center gap-4 rounded-xl border border-white/10 p-3">
                <span className="w-24 text-sm capitalize text-white">{day}</span>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!hours.closed}
                    onChange={(e) =>
                      setWorkingHours({
                        ...workingHours,
                        [day]: { ...hours, closed: !e.target.checked }
                      })
                    }
                    className="rounded border-white/20"
                  />
                  <span className="text-sm text-[--sk-text-muted]">Aberto</span>
                </label>
                {!hours.closed && (
                  <>
                    <Input
                      type="time"
                      value={hours.open}
                      onChange={(e) =>
                        setWorkingHours({
                          ...workingHours,
                          [day]: { ...hours, open: e.target.value }
                        })
                      }
                      className="w-28"
                    />
                    <span className="text-[--sk-text-muted]">até</span>
                    <Input
                      type="time"
                      value={hours.close}
                      onChange={(e) =>
                        setWorkingHours({
                          ...workingHours,
                          [day]: { ...hours, close: e.target.value }
                        })
                      }
                      className="w-28"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        );

      case "team":
        return (
          <div className="space-y-4">
            {teamMembers.map((member, index) => (
              <div key={index} className="rounded-xl border border-white/10 p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input
                    placeholder="Nome do profissional"
                    value={member.name}
                    onChange={(e) => {
                      const newMembers = [...teamMembers];
                      newMembers[index].name = e.target.value;
                      setTeamMembers(newMembers);
                    }}
                  />
                  <Input
                    placeholder="Telefone"
                    value={member.phone}
                    onChange={(e) => {
                      const newMembers = [...teamMembers];
                      newMembers[index].phone = e.target.value;
                      setTeamMembers(newMembers);
                    }}
                  />
                  <select
                    value={member.role}
                    onChange={(e) => {
                      const newMembers = [...teamMembers];
                      newMembers[index].role = e.target.value;
                      setTeamMembers(newMembers);
                    }}
                    className="h-11 rounded-xl border border-white/10 bg-slate-950/50 px-3 text-sm text-white"
                  >
                    <option value="professional">Profissional</option>
                    <option value="admin">Administrador</option>
                    <option value="receptionist">Recepcionista</option>
                  </select>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setTeamMembers([...teamMembers, { name: "", phone: "", role: "professional" }])}
            >
              + Adicionar profissional
            </Button>
          </div>
        );

      case "services":
        return (
          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="rounded-xl border border-white/10 p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input
                    placeholder="Nome do serviço"
                    value={service.name}
                    onChange={(e) => {
                      const newServices = [...services];
                      newServices[index].name = e.target.value;
                      setServices(newServices);
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Duração (min)"
                    value={service.duration || ""}
                    onChange={(e) => {
                      const newServices = [...services];
                      newServices[index].duration = parseInt(e.target.value) || 0;
                      setServices(newServices);
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Preço (R$)"
                    value={service.price || ""}
                    onChange={(e) => {
                      const newServices = [...services];
                      newServices[index].price = parseFloat(e.target.value) || 0;
                      setServices(newServices);
                    }}
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setServices([...services, { name: "", duration: 60, price: 0 }])}
            >
              + Adicionar serviço
            </Button>
          </div>
        );

      case "whatsapp":
        return (
          <div className="space-y-6">
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-6 text-center">
              <h3 className="text-lg font-medium text-white">Conectar WhatsApp</h3>
              <p className="mt-2 text-sm text-[--sk-text-secondary]">
                Conecte seu WhatsApp Business para ativar o atendimento automatizado
              </p>
              <div className="mt-4">
                <Input
                  placeholder="Nome da instância"
                  value={whatsapp.instanceName}
                  onChange={(e) => setWhatsapp({ ...whatsapp, instanceName: e.target.value })}
                  className="mx-auto max-w-sm"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="mt-4"
                onClick={() => setWhatsapp({ ...whatsapp, connected: true })}
              >
                {whatsapp.connected ? "✓ Conectado" : "Conectar WhatsApp"}
              </Button>
            </div>
            <p className="text-center text-sm text-[--sk-text-muted]">
              Você pode pular esta etapa e conectar depois nas configurações
            </p>
          </div>
        );

      case "agent":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-[--sk-text-secondary]">Nome do agente</label>
              <Input
                value={agentConfig.name}
                onChange={(e) => setAgentConfig({ ...agentConfig, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-[--sk-text-secondary]">Tom de voz</label>
              <select
                value={agentConfig.tone}
                onChange={(e) => setAgentConfig({ ...agentConfig, tone: e.target.value })}
                className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 text-sm text-white"
              >
                <option value="professional">Profissional</option>
                <option value="friendly">Amigável</option>
                <option value="casual">Casual</option>
                <option value="luxury">Luxo/Premium</option>
              </select>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-sm text-[--sk-text-muted]">
                O agente responderá automaticamente mensagens no WhatsApp,
                confirmará agendamentos e enviará lembretes.
              </p>
            </div>
          </div>
        );

      case "review":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="text-lg font-medium text-white">Resumo da configuração</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[--sk-text-muted]">Empresa:</span>
                  <span className="text-white">{businessData.name || "Não informado"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[--sk-text-muted]">Horários:</span>
                  <span className="text-white">Configurado</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[--sk-text-muted]">Equipe:</span>
                  <span className="text-white">{teamMembers.filter((m) => m.name).length} profissionais</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[--sk-text-muted]">Serviços:</span>
                  <span className="text-white">{services.filter((s) => s.name).length} serviços</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[--sk-text-muted]">WhatsApp:</span>
                  <span className="text-white">{whatsapp.connected ? "Conectado" : "Pendente"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[--sk-text-muted]">Agente IA:</span>
                  <span className="text-white">{agentConfig.name}</span>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-[--sk-text-muted]">
              Você pode editar todas essas configurações depois no painel
            </p>
          </div>
        );
    }
  }

  const isLastStep = activeStepIndex === steps.length - 1;

  return (
    <Card>
      <CardContent className="p-8">
        <Stepper steps={steps} currentStep={activeStep} />
        <StepHeader step={activeStep} />

        {renderStepContent()}

        <div className="mt-8 flex justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={isLoading || isLastStep}
          >
            Pular
          </Button>

          {isLastStep ? (
            <Button onClick={handleComplete} disabled={isLoading}>
              {isLoading ? "Finalizando..." : "Concluir configuração"}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={isLoading}>
              {isLoading ? "Salvando..." : "Continuar"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
