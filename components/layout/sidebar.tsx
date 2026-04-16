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
    <aside className="hidden h-screen w-80 shrink-0 border-r border-white/10 bg-slate-950/70 px-6 py-8 lg:flex lg:flex-col">
      <div className="mb-10">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-pink to-brand-purple text-lg font-bold text-white">
            S
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">SkinnIA</p>
            <h1 className="text-lg font-semibold text-white">Painel Operacional</h1>
          </div>
        </div>
      </div>

      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-300 transition-all hover:bg-white/5 hover:text-white",
                active && "bg-white/10 text-white shadow-inner shadow-white/5"
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[28px] border border-white/10 bg-gradient-to-br from-brand-pink/15 to-brand-purple/15 p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-pink-200/70">Plano atual</p>
        <h2 className="mt-2 text-xl font-semibold text-white">SkinnIA Pro</h2>
        <p className="mt-2 text-sm text-slate-300">
          WhatsApp ativo, automações monitoradas e painel pronto para operação multi-unidade.
        </p>
      </div>
    </aside>
  );
}
