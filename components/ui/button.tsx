import * as React from "react";

import { cn } from "@/lib/utils/cn";

const variants = {
  // Bridge: violet → cyan em vez de pink → purple
  default:
    "bg-gradient-to-r from-brand-violet via-purple-600 to-brand-cyan text-white shadow-brand hover:opacity-90 active:scale-[0.98]",
  secondary:
    "border border-violet-500/20 bg-violet-500/10 text-slate-100 hover:bg-violet-500/15 hover:border-violet-400/30 transition-colors",
  ghost:
    "text-slate-300 hover:bg-violet-500/10 hover:text-white transition-colors",
  outline:
    "border border-violet-500/20 bg-transparent text-slate-100 hover:bg-violet-500/10 hover:border-violet-400/30 transition-colors",
  destructive:
    "bg-rose-500/90 text-white hover:bg-rose-500 active:scale-[0.98] transition-all"
};

const sizes = {
  default: "h-11 px-5 py-2",
  sm: "h-9 rounded-xl px-3 text-sm",
  lg: "h-12 rounded-2xl px-6 text-base",
  icon: "h-10 w-10 rounded-2xl"
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40",
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    />
  )
);

Button.displayName = "Button";
