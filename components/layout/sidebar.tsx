"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  CalendarRange,
  CreditCard,
  LayoutDashboard,
  LogIn,
  MessageSquare,
  Settings,
  Settings2,
  Sparkles,
  Users,
  Zap
} from "lucide-react";

import { cn } from "@/lib/utils/cn";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Principal",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/agenda", label: "Agenda", icon: CalendarRange },
      { href: "/clientes", label: "Clientes", icon: Users },
      { href: "/financeiro", label: "Financeiro", icon: CreditCard }
    ]
  },
  {
    title: "Operação",
    items: [
      { href: "/equipe", label: "Equipe", icon: Sparkles },
      { href: "/conversas", label: "Conversas", icon: MessageSquare },
      { href: "/automacao", label: "Automações", icon: Bot },
      { href: "/agentes", label: "Agentes IA", icon: Zap }
    ]
  },
  {
    title: "Sistema",
    items: [
      { href: "/integracoes", label: "Integrações", icon: Settings2 },
      { href: "/logs", label: "Logs & Eventos", icon: LogIn },
      { href: "/configuracoes", label: "Configurações", icon: Settings }
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden h-screen w-72 shrink-0 flex-col px-4 py-6 lg:flex",
        "bg-[var(--sk-bg-sidebar)] border-r border-[var(--sk-border)]"
      )}
      style={{
        backgroundImage: "var(--sk-gradient-sidebar)"
      }}
    >
      {/* Logo */}
      <div className="mb-5 px-2">
        <div className={cn(
          "inline-flex items-center gap-3 rounded-2xl px-3 py-2",
          "bg-[var(--sk-bg-card)] border border-[var(--sk-border)]",
          "shadow-[var(--sk-shadow-sm)]"
        )}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-violet to-brand-cyan text-sm font-bold text-white shadow-brand">
            S
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--sk-text-brand)]">
              SkinnIA
            </p>
            <h1 className="font-display text-sm font-semibold text-[var(--sk-text-primary)] leading-tight">
              Painel Operacional
            </h1>
          </div>
        </div>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 space-y-5 overflow-y-auto pr-1 scrollbar-thin">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            {/* Group Header - Mais visível */}
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--sk-text-muted)]">
              {group.title}
            </p>
            {/* Group Items */}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-[var(--sk-brand-500)]/10 text-[var(--sk-text-primary)] ring-1 ring-[var(--sk-brand-500)]/25 shadow-[var(--sk-shadow-sm)]"
                        : "text-[var(--sk-text-secondary)] hover:bg-[var(--sk-bg-hover)] hover:text-[var(--sk-text-primary)]"
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-colors",
                        active ? "text-[var(--sk-brand-500)]" : "text-[var(--sk-text-muted)]"
                      )}
                    />
                    <span>{item.label}</span>
                    {active && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-[var(--sk-brand-500)]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Plan card - Mais refinado */}
      <div
        className={cn(
          "mt-3 rounded-[20px] border p-4",
          "bg-gradient-to-br from-[var(--sk-brand-500)]/8 to-[var(--sk-accent-400)]/5",
          "border-[var(--sk-brand-500)]/20"
        )}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--sk-brand-600)]">
          Plano atual
        </p>
        <h2 className="font-display mt-1.5 text-base font-bold text-[var(--sk-text-primary)]">
          SkinnIA Pro
        </h2>
        <p className="mt-2 text-xs text-[var(--sk-text-secondary)] leading-relaxed">
          WhatsApp ativo, automações monitoradas e painel multi-unidade.
        </p>
      </div>
    </aside>
  );
}
