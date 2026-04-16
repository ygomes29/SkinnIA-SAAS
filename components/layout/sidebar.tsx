"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  CalendarRange,
  CreditCard,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users
} from "lucide-react";

import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: CalendarRange },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/financeiro", label: "Financeiro", icon: CreditCard },
  { href: "/equipe", label: "Equipe", icon: Sparkles },
  { href: "/automacao", label: "Automação", icon: Bot },
  { href: "/configuracoes", label: "Configurações", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden h-screen w-72 shrink-0 flex-col border-r border-violet-500/15 bg-[#0D1226] px-5 py-7 lg:flex"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(124,58,237,0.05) 0%, transparent 60%)"
      }}
    >
      {/* Logo */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-violet-500/15 bg-white/[0.04] px-3.5 py-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-violet to-brand-cyan text-base font-bold text-white shadow-brand">
            S
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-[--sk-text-brand]">
              SkinnIA
            </p>
            <h1 className="font-display text-base font-semibold text-white leading-tight">
              Painel Operacional
            </h1>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-brand-violet/18 text-white ring-1 ring-brand-violet/28 shadow-[0_2px_8px_rgba(124,58,237,0.18)]"
                  : "text-[--sk-text-muted] hover:bg-violet-500/8 hover:text-slate-200"
              )}
              href={item.href}
              key={item.href}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  active ? "text-brand-cyan" : "text-[--sk-text-muted]"
                )}
              />
              <span>{item.label}</span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-cyan" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Plan card */}
      <div
        className="mt-auto rounded-[22px] border border-violet-500/18 p-4"
        style={{ background: "var(--sk-gradient-brand-soft)" }}
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[--sk-text-brand]">
          Plano atual
        </p>
        <h2 className="font-display mt-1.5 text-lg font-semibold text-white">
          SkinnIA Pro
        </h2>
        <p className="mt-1.5 text-sm text-[--sk-text-secondary] leading-relaxed">
          WhatsApp ativo, automações monitoradas e painel pronto para operação multi-unidade.
        </p>
      </div>
    </aside>
  );
}
