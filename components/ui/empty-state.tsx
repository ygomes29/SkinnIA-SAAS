import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  variant?: "default" | "compact" | "card";
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  variant = "default",
}: EmptyStateProps) {
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-8 px-4 text-center",
          className
        )}
      >
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl mb-3",
            "bg-[var(--sk-bg-soft)]",
            "text-[var(--sk-text-muted)]"
          )}
        >
          {icon}
        </div>
        <p className="text-sm font-medium text-[var(--sk-text-secondary)]">
          {title}
        </p>
        {description && (
          <p className="mt-1 text-xs text-[var(--sk-text-muted)] max-w-xs">
            {description}
          </p>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-2xl border p-6 text-center",
          "border-[var(--sk-border)] bg-[var(--sk-bg-card)]",
          "shadow-[var(--sk-shadow-sm)]",
          className
        )}
      >
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl mx-auto mb-4",
            "bg-gradient-to-br from-[var(--sk-brand-500)]/10 to-[var(--sk-accent-400)]/5",
            "text-[var(--sk-brand-600)]"
          )}
        >
          {icon}
        </div>
        <h3 className="font-display text-base font-semibold text-[var(--sk-text-primary)]">
          {title}
        </h3>
        {description && (
          <p className="mt-2 text-sm text-[var(--sk-text-secondary)] max-w-sm mx-auto">
            {description}
          </p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl mb-4",
          "bg-gradient-to-br from-[var(--sk-brand-500)]/15 to-[var(--sk-accent-400)]/10",
          "text-[var(--sk-brand-600)]",
          "shadow-[var(--sk-shadow-brand)]"
        )}
      >
        {icon}
      </div>
      <h3 className="font-display text-lg font-bold text-[var(--sk-text-primary)]">
        {title}
      </h3>
      {description && (
        <p className="mt-2 text-sm text-[var(--sk-text-secondary)] max-w-md">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
