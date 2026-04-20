import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        className={cn(
          "flex h-11 w-full appearance-none rounded-2xl border px-4 py-2 pr-10 text-sm transition-all duration-200",
          "bg-[var(--sk-bg-input)] border-[var(--sk-border)]",
          "text-[var(--sk-text-primary)]",
          "focus:border-[var(--sk-border-focus)] focus:outline-none focus:ring-4 focus:ring-[var(--sk-brand-500)]/10",
          "hover:border-[var(--sk-border-strong)]",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sk-text-muted)]" />
    </div>
  )
);

Select.displayName = "Select";
