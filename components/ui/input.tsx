import * as React from "react";

import { cn } from "@/lib/utils/cn";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-xl border px-3 py-2 text-sm transition-all duration-200",
        "bg-[var(--sk-bg-input)] border-[var(--sk-border)]",
        "text-[var(--sk-text-primary)] placeholder:text-[var(--sk-text-muted)]",
        "focus:border-[var(--sk-brand-500)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--sk-brand-500)]/10",
        "hover:border-[var(--sk-border-strong)]",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
