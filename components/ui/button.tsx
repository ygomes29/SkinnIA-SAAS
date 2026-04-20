import * as React from "react";

import { cn } from "@/lib/utils/cn";

const variants = {
  // Primary: gradiente brand mais vivo
  default:
    "bg-gradient-to-r from-[var(--sk-brand-600)] via-[var(--sk-brand-500)] to-[var(--sk-accent-500)] text-white shadow-[var(--sk-shadow-brand)] hover:shadow-[var(--sk-shadow-md)] hover:brightness-105 active:scale-[0.98]",

  // Secondary: mais definido
  secondary:
    "border border-[var(--sk-border)] bg-[var(--sk-bg-card)] text-[var(--sk-text-secondary)] hover:bg-[var(--sk-bg-hover)] hover:border-[var(--sk-border-strong)] hover:text-[var(--sk-text-primary)] shadow-[var(--sk-shadow-sm)]",

  // Ghost: hover mais claro
  ghost:
    "text-[var(--sk-text-muted)] hover:bg-[var(--sk-bg-hover)] hover:text-[var(--sk-text-primary)]",

  // Outline: mais estruturado
  outline:
    "border border-[var(--sk-border)] bg-transparent text-[var(--sk-text-secondary)] hover:bg-[var(--sk-bg-hover)] hover:border-[var(--sk-border-strong)] hover:text-[var(--sk-text-primary)]",

  // Destructive: mais vibrante
  destructive:
    "bg-[var(--sk-danger)] text-white shadow-sm hover:bg-[var(--sk-danger)]/90 active:scale-[0.98]"
};

const sizes = {
  default: "h-10 px-4 py-2 rounded-xl text-sm",
  sm: "h-8 rounded-lg px-3 text-xs",
  lg: "h-11 rounded-xl px-5 text-sm",
  icon: "h-9 w-9 rounded-xl"
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40",
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
