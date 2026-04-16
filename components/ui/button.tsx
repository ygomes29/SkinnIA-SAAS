import * as React from "react";

import { cn } from "@/lib/utils/cn";

const variants = {
  default:
    "bg-gradient-to-r from-brand-pink via-fuchsia-500 to-brand-purple text-white shadow-glow hover:opacity-95",
  secondary:
    "border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10",
  ghost: "text-slate-200 hover:bg-white/10",
  outline: "border border-white/10 bg-transparent text-slate-100 hover:bg-white/5",
  destructive: "bg-rose-500 text-white hover:bg-rose-400"
};

const sizes = {
  default: "h-11 px-4 py-2",
  sm: "h-9 rounded-xl px-3 text-sm",
  lg: "h-12 rounded-2xl px-5 text-base",
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
        "inline-flex items-center justify-center rounded-2xl font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
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
