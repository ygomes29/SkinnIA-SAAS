"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { cn } from "@/lib/utils/cn";

interface ThemeToggleProps {
  variant?: "icon" | "button" | "dropdown";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  if (variant === "button") {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
          "bg-[var(--sk-bg-card)] text-[var(--sk-text-secondary)]",
          "border border-[var(--sk-border)] hover:border-[var(--sk-border-strong)]",
          "hover:bg-[var(--sk-bg-card-hover)] hover:text-[var(--sk-text-primary)]",
          className
        )}
        aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      >
        {isDark ? (
          <>
            <Sun className="h-4 w-4 text-amber-400" />
            <span className="hidden sm:inline">Claro</span>
          </>
        ) : (
          <>
            <Moon className="h-4 w-4 text-[var(--sk-brand-500)]" />
            <span className="hidden sm:inline">Escuro</span>
          </>
        )}
      </button>
    );
  }

  // Icon variant (default)
  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200",
        "bg-[var(--sk-bg-card)] text-[var(--sk-text-muted)]",
        "border border-[var(--sk-border)] hover:border-[var(--sk-border-strong)]",
        "hover:bg-[var(--sk-bg-card-hover)] hover:text-[var(--sk-text-primary)]",
        "focus:outline-none focus:ring-2 focus:ring-[var(--sk-brand-500)]/20",
        className
      )}
      aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
    >
      <Sun
        className={cn(
          "h-[18px] w-[18px] transition-all duration-300",
          isDark
            ? "scale-0 rotate-90 opacity-0"
            : "scale-100 rotate-0 opacity-100 text-amber-500"
        )}
      />
      <Moon
        className={cn(
          "absolute h-[18px] w-[18px] transition-all duration-300",
          isDark
            ? "scale-100 rotate-0 opacity-100 text-[var(--sk-brand-400)]"
            : "scale-0 -rotate-90 opacity-0"
        )}
      />
    </button>
  );
}

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const options = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Escuro", icon: Moon },
    { value: "system", label: "Sistema", icon: Monitor },
  ] as const;

  return (
    <div className="flex items-center gap-1 rounded-xl bg-[var(--sk-bg-soft)] p-1 border border-[var(--sk-border-subtle)]">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;

        return (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200",
              isActive
                ? "bg-[var(--sk-bg-card)] text-[var(--sk-text-primary)] shadow-sm border border-[var(--sk-border)]"
                : "text-[var(--sk-text-muted)] hover:text-[var(--sk-text-secondary)] hover:bg-[var(--sk-bg-hover)]"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
