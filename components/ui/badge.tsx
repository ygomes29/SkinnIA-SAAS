import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

const variants = {
  neutral: "bg-white/10 text-slate-200",
  success: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20",
  warning: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/20",
  danger: "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/20",
  info: "bg-brand-purple/20 text-violet-200 ring-1 ring-violet-400/20",
  pink: "bg-brand-pink/15 text-pink-200 ring-1 ring-pink-400/20"
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
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
