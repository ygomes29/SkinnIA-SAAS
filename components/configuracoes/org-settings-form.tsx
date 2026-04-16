"use client";

import { useFormState, useFormStatus } from "react-dom";

import { saveOrgAction, type SettingsState } from "@/app/(dashboard)/configuracoes/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Organization } from "@/types/skinnia";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? "Salvando…" : "Salvar dados"}
    </Button>
  );
}

export function OrgSettingsForm({ org }: { org: Organization | null }) {
  const [state, action] = useFormState<SettingsState, FormData>(saveOrgAction, {});
  const settings = (org?.settings ?? {}) as Record<string, string>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil da organização</CardTitle>
        <CardDescription>Dados usados em auth, agente e onboarding.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Nome do estúdio</label>
            <Input defaultValue={org?.name ?? ""} name="name" placeholder="Ex: Studio Lumi" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Cidade</label>
            <Input defaultValue={settings.city ?? ""} name="city" placeholder="Ex: Belo Horizonte" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Tipo de negócio</label>
            <Input defaultValue={settings.org_type ?? ""} name="org_type" placeholder="Ex: studio, salão, clínica" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Timezone</label>
            <Input defaultValue={org?.timezone ?? "America/Sao_Paulo"} name="timezone" placeholder="America/Sao_Paulo" />
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
