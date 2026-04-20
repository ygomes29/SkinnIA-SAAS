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
      "sticky top-0 z-20 flex flex-col gap-3 px-4 py-3 backdrop-blur-xl sm:px-5",
      "border-b border-[var(--sk-border)] bg-[var(--sk-bg-topbar)]",
      "lg:flex-row lg:items-center lg:justify-between"
    )}>
      {/* Left: Page Title with more presence */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          "bg-gradient-to-br from-[var(--sk-brand-500)] to-[var(--sk-accent-400)]",
          "text-white shadow-[var(--sk-shadow-brand)]"
        )}>
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--sk-brand-600)]">
            SkinnIA Control Center
          </p>
          <h2 className="font-display text-xl font-bold text-[var(--sk-text-primary)] leading-tight">
            Operação em tempo real
          </h2>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative block w-full sm:w-auto sm:min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sk-text-muted)]" />
          <Input
            className="pl-9 h-9 text-sm"
            placeholder="Buscar cliente, conversa ou horário..."
          />
        </label>

        <div className="h-6 w-px bg-[var(--sk-border)] mx-1 hidden sm:block" />

        <ThemeToggle />

        <Button size="icon" variant="secondary" className="h-9 w-9">
          <Bell className="h-[18px] w-[18px]" />
        </Button>

        <Button className="gap-1.5 h-9 text-sm px-3" variant="secondary">
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Nova automação</span>
          <span className="sm:hidden">Novo</span>
        </Button>

        <div className={cn(
          "flex items-center gap-2 rounded-xl px-2.5 py-1.5",
          "bg-[var(--sk-bg-card)] border border-[var(--sk-border)]",
          "shadow-[var(--sk-shadow-sm)] cursor-pointer hover:border-[var(--sk-border-strong)]",
          "transition-colors"
        )}>
          <Avatar name={displayName} />
          <div className="hidden text-left md:block">
            <p className="text-sm font-semibold text-[var(--sk-text-primary)] leading-tight">{displayName}</p>
            <p className="text-[10px] text-[var(--sk-text-muted)]">Owner</p>
          </div>
        </div>

        <form action={logoutAction}>
          <Button size="icon" title="Sair" type="submit" variant="ghost" className="h-9 w-9">
            <LogOut className="h-[18px] w-[18px]" />
          </Button>
        </form>
      </div>
    </header>
  );
}
