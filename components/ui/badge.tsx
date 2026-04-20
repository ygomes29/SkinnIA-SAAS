import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

const variants = {
  neutral: [
    "bg-[var(--sk-bg-soft)] text-[var(--sk-text-secondary)]",
    "ring-1 ring-[var(--sk-border)]"
  ].join(" "),
  success: [
    "bg-[var(--sk-success-bg)] text-[var(--sk-success)]",
    "ring-1 ring-[var(--sk-success-border)]"
  ].join(" "),
  warning: [
    "bg-[var(--sk-warning-bg)] text-[var(--sk-warning)]",
    "ring-1 ring-[var(--sk-warning-border)]"
  ].join(" "),
  danger: [
    "bg-[var(--sk-danger-bg)] text-[var(--sk-danger)]",
    "ring-1 ring-[var(--sk-danger-border)]"
  ].join(" "),
  info: [
    "bg-[var(--sk-info-bg)] text-[var(--sk-info)]",
    "ring-1 ring-[var(--sk-info-border)]"
  ].join(" "),
  pink: [
    "bg-[var(--sk-bg-soft)] text-[var(--sk-brand-400)]",
    "ring-1 ring-[var(--sk-border)]"
  ].join(" ")
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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
