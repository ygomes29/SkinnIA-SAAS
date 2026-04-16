import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        className={cn(
          "flex h-11 w-full appearance-none rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-2 pr-10 text-sm text-slate-100 focus:border-brand-pink/50 focus:outline-none focus:ring-2 focus:ring-brand-pink/20",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </div>
  )
);

Select.displayName = "Select";
