import { getConversationThreads } from "@/lib/dashboard-data";
import { ThreadList } from "@/components/conversas/thread-list";

export default async function ConversasPage() {
  const threads = await getConversationThreads();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-[--sk-text-brand]">Conversas</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--sk-text-primary)]">
          Central de atendimento
        </h1>
        <p className="mt-2 text-[--sk-text-secondary]">
          Conversas do WhatsApp com clientes, organizadas por status.
        </p>
      </div>

      <ThreadList initialThreads={threads} />
    </div>
  );
}
