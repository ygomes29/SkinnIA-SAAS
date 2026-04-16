import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-pink-200/70">Configurações</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Organização, canais e personalidade do agente</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Perfil da organização</CardTitle>
            <CardDescription>Dados usados em auth, agente e onboarding.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input defaultValue="SkinnIA Studio" placeholder="Nome" />
            <Input defaultValue="Belo Horizonte" placeholder="Cidade" />
            <Input defaultValue="America/Sao_Paulo" placeholder="Timezone" />
            <Button>Salvar dados</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agente conversacional</CardTitle>
            <CardDescription>Tom de voz e instruções da assistente do WhatsApp.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input defaultValue="Luna" placeholder="Nome do agente" />
            <Input defaultValue="premium, acolhedor e objetivo" placeholder="Tom" />
            <Textarea defaultValue="Sempre responda em português brasileiro informal, sem inventar disponibilidade e oferecendo atendimento humano quando necessário." />
            <Button variant="secondary">Salvar prompt-base</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
