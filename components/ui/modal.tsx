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
    <div className="fixed inset-0 z-50 flex bg-slate-950/70 backdrop-blur-sm">
      <button
        aria-label="Fechar modal"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div
        className={cn(
          "relative z-10 m-auto w-full max-w-2xl rounded-[32px] border border-white/10 bg-slate-950/95 p-6 shadow-[0_40px_120px_rgba(2,6,23,0.65)]",
          align === "right" && "ml-auto mr-0 h-full max-w-xl rounded-none rounded-l-[32px]",
          panelClassName
        )}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-white">{title}</h3>
            {description ? <p className="mt-2 text-sm text-slate-400">{description}</p> : null}
          </div>
          <button
            className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
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
