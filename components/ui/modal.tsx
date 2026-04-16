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
    <div className="fixed inset-0 z-50 flex bg-slate-950/75 backdrop-blur-sm">
      <button
        aria-label="Fechar modal"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div
        className={cn(
          "relative z-10 m-auto w-full max-w-2xl rounded-[32px] border border-violet-500/20 bg-[#0D1226]/97 p-6 shadow-[0_40px_120px_rgba(124,58,237,0.22),_0_8px_32px_rgba(0,0,0,0.40)]",
          align === "right" && "ml-auto mr-0 h-full max-w-xl rounded-none rounded-l-[32px]",
          panelClassName
        )}
      >
        {/* Linha superior sutil de brilho */}
        <div className="absolute inset-x-6 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl font-semibold text-white">{title}</h3>
            {description ? (
              <p className="mt-1.5 text-sm text-[--sk-text-muted]">{description}</p>
            ) : null}
          </div>
          <button
            className="rounded-2xl border border-violet-500/15 bg-violet-500/8 p-2 text-slate-400 transition hover:bg-violet-500/15 hover:text-white"
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
