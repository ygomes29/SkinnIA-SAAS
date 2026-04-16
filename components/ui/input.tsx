import * as React from "react";

import { cn } from "@/lib/utils/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-violet-500/15 bg-slate-950/50 px-4 py-2 text-sm text-slate-100 placeholder:text-[--sk-text-muted] focus:border-brand-violet/45 focus:outline-none focus:ring-2 focus:ring-brand-violet/18 transition-colors",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
