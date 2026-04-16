import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

const variants = {
  neutral:
    "bg-white/8 text-slate-300 ring-1 ring-white/10",
  success:
    "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25",
  warning:
    "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/25",
  danger:
    "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/25",
  info:
    "bg-brand-violet/15 text-violet-300 ring-1 ring-brand-violet/25",
  pink:
    // mantido para compatibilidade — aparece em alguns status de agendamento
    "bg-brand-pink/12 text-pink-200 ring-1 ring-brand-pink/20"
};

export function Badge({
  className,
  variant = "neutral",
  children
}: {
  className?: string;
  variant?: keyof typeof variants;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
