import * as React from "react";

import { cn } from "@/lib/utils/cn";

const variants = {
  // Primary: gradiente brand com sombra premium
  default:
    "bg-gradient-to-r from-brand-violet via-purple-600 to-brand-cyan text-white shadow-brand hover:opacity-90 active:scale-[0.98]",

  // Secondary: fundo suave com borda sutil
  secondary:
    "border border-[var(--sk-border)] bg-[var(--sk-bg-soft)] text-[var(--sk-text-secondary)] hover:bg-[var(--sk-bg-hover)] hover:border-[var(--sk-border-strong)] hover:text-[var(--sk-text-primary)] transition-all",

  // Ghost: apenas hover
  ghost:
    "text-[var(--sk-text-muted)] hover:bg-[var(--sk-bg-hover)] hover:text-[var(--sk-text-primary)] transition-colors",

  // Outline: transparente com borda
  outline:
    "border border-[var(--sk-border)] bg-transparent text-[var(--sk-text-secondary)] hover:bg-[var(--sk-bg-hover)] hover:border-[var(--sk-border-strong)] hover:text-[var(--sk-text-primary)] transition-all",

  // Destructive: erro/perigo
  destructive:
    "bg-[var(--sk-danger)] text-white hover:opacity-90 active:scale-[0.98] transition-all"
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
