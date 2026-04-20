import { Bell, LogOut, Search, Sparkles } from "lucide-react";

import { logoutAction } from "@/app/(auth)/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils/cn";

export async function Header() {
  const supabase = createSupabaseServerClient();
  const userEmail = supabase
    ? (await supabase.auth.getUser()).data.user?.email
    : null;

  const displayName = userEmail?.split("@")[0] ?? "Usuário";

  return (
    <header className={cn(
      "sticky top-0 z-20 flex flex-col gap-4 px-4 py-4 backdrop-blur-xl sm:px-6",
      "border-b border-[var(--sk-border)] bg-[var(--sk-bg-topbar)]",
      "lg:flex-row lg:items-center lg:justify-between"
    )}>
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--sk-text-brand)]">SkinnIA Control Center</p>
        <h2 className="font-display text-2xl font-semibold text-[var(--sk-text-primary)]">Operação em tempo real</h2>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative block min-w-[280px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sk-text-muted)]" />
          <Input className="pl-10" placeholder="Buscar cliente, conversa ou horário..." />
        </label>

        <ThemeToggle />

        <Button size="icon" variant="secondary">
          <Bell className="h-4 w-4" />
        </Button>

        <Button className="gap-2" variant="secondary">
          <Sparkles className="h-4 w-4" />
          Nova automação
        </Button>

        <div className={cn(
          "flex items-center gap-3 rounded-2xl px-3 py-2",
          "bg-[var(--sk-bg-card)] border border-[var(--sk-border)]"
        )}>
          <Avatar name={displayName} />
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-[var(--sk-text-primary)]">{displayName}</p>
            <p className="text-xs text-[var(--sk-text-muted)]">Owner</p>
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
