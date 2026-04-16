import { Bell, LogOut, Search, Sparkles } from "lucide-react";

import { logoutAction } from "@/app/(auth)/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function Header() {
  const supabase = createSupabaseServerClient();
  const userEmail = supabase
    ? (await supabase.auth.getUser()).data.user?.email
    : null;

  const displayName = userEmail?.split("@")[0] ?? "Usuário";

  return (
    <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-violet-500/15 bg-[#0D1226]/80 px-4 py-4 backdrop-blur-xl sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[--sk-text-brand]">SkinnIA Control Center</p>
        <h2 className="font-display text-2xl font-semibold text-white">Operação em tempo real</h2>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative block min-w-[280px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[--sk-text-muted]" />
          <Input className="pl-10" placeholder="Buscar cliente, conversa ou horário..." />
        </label>

        <Button size="icon" variant="secondary">
          <Bell className="h-4 w-4" />
        </Button>

        <Button className="gap-2" variant="secondary">
          <Sparkles className="h-4 w-4" />
          Nova automação
        </Button>

        <div className="flex items-center gap-3 rounded-2xl border border-violet-500/15 bg-violet-500/8 px-3 py-2">
          <Avatar name={displayName} />
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-white">{displayName}</p>
            <p className="text-xs text-[--sk-text-muted]">Owner</p>
          </div>
        </div>

        <form action={logoutAction}>
          <Button size="icon" title="Sair" type="submit" variant="ghost">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
