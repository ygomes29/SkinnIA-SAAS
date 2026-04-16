import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        className={cn(
          "flex h-11 w-full appearance-none rounded-2xl border border-violet-500/15 bg-slate-950/50 px-4 py-2 pr-10 text-sm text-slate-100 focus:border-brand-violet/45 focus:outline-none focus:ring-2 focus:ring-brand-violet/18 transition-colors",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[--sk-text-muted]" />
    </div>
  )
);

Select.displayName = "Select";
