import { LogIn } from "lucide-react";

export default function LogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-[--sk-text-brand]">Logs & Eventos</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Logs do sistema
        </h1>
        <p className="mt-2 text-[--sk-text-secondary]">
          Visualize eventos, execuções de automação e webhooks
        </p>
      </div>

      <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02]">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
            <LogIn className="h-8 w-8 text-violet-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-white">Logs & Eventos</h3>
          <p className="mt-2 max-w-md text-sm text-[--sk-text-muted]">
            Esta página está em desenvolvimento. Aqui você poderá visualizar logs de eventos,
            execuções de automação e webhooks recebidos.
          </p>
        </div>
      </div>
    </div>
  );
}
