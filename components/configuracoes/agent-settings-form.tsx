"use client";

import { useFormState, useFormStatus } from "react-dom";

import { saveAgentAction, type SettingsState } from "@/app/(dashboard)/configuracoes/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AgentConfig } from "@/types/skinnia";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit" variant="secondary">
      {pending ? "Salvando…" : "Salvar agente"}
    </Button>
  );
}

export function AgentSettingsForm({ agent }: { agent: AgentConfig | null }) {
  const [state, action] = useFormState<SettingsState, FormData>(saveAgentAction, {});
  const overrides = (agent?.prompt_overrides ?? {}) as Record<string, string>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agente conversacional</CardTitle>
        <CardDescription>Tom de voz e instruções da assistente do WhatsApp.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-[var(--sk-text-secondary)]">Nome do agente</label>
            <Input defaultValue={agent?.name ?? "Luna"} name="agent_name" placeholder="Ex: Luna" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[var(--sk-text-secondary)]">Tom de voz</label>
            <Input
              defaultValue={agent?.tone ?? ""}
              name="tone"
              placeholder="Ex: premium, acolhedor e objetivo"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[var(--sk-text-secondary)]">Prompt-base</label>
            <Textarea
              defaultValue={overrides.prompt_base ?? "Sempre responda em português brasileiro informal, sem inventar disponibilidade e oferecendo atendimento humano quando necessário."}
              name="prompt_base"
              rows={4}
            />
          </div>

          {state.error ? (
            <p className="rounded-2xl bg-red-500/10 px-4 py-2 text-sm text-red-400">{state.error}</p>
          ) : null}
          {state.success ? (
            <p className="rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">{state.success}</p>
          ) : null}

          <SaveButton />
        </form>
      </CardContent>
    </Card>
  );
}
