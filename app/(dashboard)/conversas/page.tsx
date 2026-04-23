import { MessageSquare } from "lucide-react";

export default function ConversasPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-[--sk-text-brand]">Conversas</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--sk-text-primary)]">
          Central de atendimento
        </h1>
        <p className="mt-2 text-[--sk-text-secondary]">
          Gerencie conversas do WhatsApp e interações com clientes
        </p>
      </div>

      <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-[var(--sk-border)] bg-[var(--sk-bg-soft)]">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
            <MessageSquare className="h-8 w-8 text-violet-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-[var(--sk-text-primary)]">Conversas</h3>
          <p className="mt-2 max-w-md text-sm text-[--sk-text-muted]">
            Esta página está em desenvolvimento. Aqui você poderá visualizar e gerenciar
            todas as conversas do WhatsApp com seus clientes.
          </p>
        </div>
      </div>
    </div>
  );
}
