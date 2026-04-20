import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  icon,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "relative mb-6 rounded-2xl border p-5",
        "bg-[var(--sk-bg-card)] border-[var(--sk-border)]",
        "shadow-[var(--sk-shadow-sm)]",
        className
      )}
    >
      {/* Subtle gradient line at top */}
      <div className="absolute inset-x-5 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-[var(--sk-brand-500)]/30 to-transparent" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {icon && (
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                "bg-gradient-to-br from-[var(--sk-brand-500)] to-[var(--sk-accent-400)]",
                "text-white shadow-[var(--sk-shadow-brand)]"
              )}
            >
              {icon}
            </div>
          )}
          <div>
            {eyebrow && (
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--sk-brand-600)] mb-1">
                {eyebrow}
              </p>
            )}
            <h1 className="font-display text-2xl font-bold text-[var(--sk-text-primary)] leading-tight">
              {title}
            </h1>
            {description && (
              <p className="mt-1.5 text-sm text-[var(--sk-text-secondary)] max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex items-center gap-2 mt-2 sm:mt-0">{children}</div>
        )}
      </div>
    </div>
  );
}
