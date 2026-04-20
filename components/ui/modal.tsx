import type { ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  align = "center",
  panelClassName
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  align?: "center" | "right";
  panelClassName?: string;
}) {
  if (!open) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex backdrop-blur-sm",
      "bg-[var(--sk-bg-app)]/75"
    )}>
      <button
        aria-label="Fechar modal"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div
        className={cn(
          "relative z-10 m-auto w-full max-w-2xl rounded-[32px] p-6",
          "border border-[var(--sk-border)] bg-[var(--sk-bg-sidebar)]/97",
          "shadow-[var(--sk-shadow-lg)]",
          align === "right" && "ml-auto mr-0 h-full max-w-xl rounded-none rounded-l-[32px]",
          panelClassName
        )}
      >
        {/* Linha superior sutil de brilho */}
        <div className="absolute inset-x-6 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-[var(--sk-brand-500)]/30 to-transparent" />

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl font-semibold text-[var(--sk-text-primary)]">{title}</h3>
            {description ? (
              <p className="mt-1.5 text-sm text-[var(--sk-text-muted)]">{description}</p>
            ) : null}
          </div>
          <button
            className={cn(
              "rounded-2xl border p-2 transition-all duration-200",
              "border-[var(--sk-border)] bg-[var(--sk-bg-soft)] text-[var(--sk-text-muted)]",
              "hover:bg-[var(--sk-bg-hover)] hover:text-[var(--sk-text-primary)]"
            )}
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
