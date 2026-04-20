"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Asterisk, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";

import { registerAction, type AuthState } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils/cn";

const initialState: AuthState = { error: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className={cn(
        "group relative flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-semibold text-white transition-all duration-200",
        "bg-gradient-to-r from-[#5C5CFF] to-[#7C3AED] hover:shadow-[0_0_20px_rgba(92,92,255,0.3)]",
        "disabled:opacity-70",
        pending && "cursor-not-allowed"
      )}
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Criando conta...</span>
        </div>
      ) : (
        "Criar conta"
      )}
    </button>
  );
}

export default function RegisterPage() {
  const [state, formAction] = useFormState(registerAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={cn(
      "flex w-full max-w-[1200px] flex-col overflow-hidden rounded-[32px] lg:h-[760px] lg:flex-row",
      "bg-[var(--sk-bg-card)] shadow-premium"
    )}>
      {/* Left Column: Visual Panel */}
      <div className="relative flex min-h-[300px] flex-col justify-between p-10 lg:w-[42%] lg:p-12">
        {/* Background Gradient */}
        <div className="absolute inset-0 z-0 bg-auth-gradient opacity-90" />
        <div className="absolute inset-0 z-0 bg-white/10 backdrop-blur-[2px]" />

        {/* Asterisk Icon */}
        <div className="relative z-10">
          <Asterisk className="h-8 w-8 text-white" />
        </div>

        {/* Text Content */}
        <div className="relative z-10 max-w-[320px] space-y-4">
          <p className="text-sm font-semibold tracking-wide text-white/90">
            Bem-vinda à SkinnIA
          </p>
          <h2 className="text-3xl font-bold leading-tight text-white lg:text-[40px]">
            Gerencie seu negócio de beleza com mais clareza, produtividade e inteligência
          </h2>
        </div>
      </div>

      {/* Right Column: Form Panel */}
      <div className="flex flex-col items-center justify-center bg-white p-6 lg:w-[58%] lg:p-10 shrink-0 overflow-y-auto">
        <div className="w-full max-w-[420px] space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <Asterisk className="h-6 w-6 text-[#5C5CFF]" />
            <h1 className="text-3xl font-bold text-slate-900">Crie sua conta</h1>
            <p className="max-w-[360px] text-[15px] leading-relaxed text-slate-500">
              Comece a organizar sua operação, automatizar atendimentos e acompanhar seu negócio com mais eficiência.
            </p>
          </div>

          {/* Form */}
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="full_name">
                Nome completo
              </label>
              <input
                id="full_name"
                name="full_name"
                placeholder="Seu nome completo"
                required
                className={cn(
                  "w-full rounded-xl border px-4 py-2.5 text-[15px] outline-none transition-all",
                  "border-slate-200 bg-white text-slate-900",
                  "placeholder:text-slate-400",
                  "focus:border-[#5C5CFF] focus:ring-4 focus:ring-[#5C5CFF]/5"
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="business_name">
                Nome do negócio
              </label>
              <input
                id="business_name"
                name="business_name"
                placeholder="Nome do seu negócio"
                required
                className={cn(
                  "w-full rounded-xl border px-4 py-2.5 text-[15px] outline-none transition-all",
                  "border-slate-200 bg-white text-slate-900",
                  "placeholder:text-slate-400",
                  "focus:border-[#5C5CFF] focus:ring-4 focus:ring-[#5C5CFF]/5"
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="voce@empresa.com"
                required
                className={cn(
                  "w-full rounded-xl border px-4 py-2.5 text-[15px] outline-none transition-all",
                  "border-slate-200 bg-white text-slate-900",
                  "placeholder:text-slate-400",
                  "focus:border-[#5C5CFF] focus:ring-4 focus:ring-[#5C5CFF]/5"
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700" htmlFor="password">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Crie uma senha"
                    required
                    minLength={8}
                    className={cn(
                      "w-full rounded-xl border px-4 py-2 text-[15px] outline-none transition-all",
                      "border-slate-200 bg-white text-slate-900",
                      "placeholder:text-slate-400",
                      "focus:border-[#5C5CFF] focus:ring-4 focus:ring-[#5C5CFF]/5"
                    )}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700" htmlFor="confirm_password">
                  Confirmar senha
                </label>
                <div className="relative">
                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repita sua senha"
                    required
                    className={cn(
                      "w-full rounded-xl border px-4 py-2 text-[15px] outline-none transition-all",
                      "border-slate-200 bg-white text-slate-900",
                      "placeholder:text-slate-400",
                      "focus:border-[#5C5CFF] focus:ring-4 focus:ring-[#5C5CFF]/5"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {state?.error ? (
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {state.error}
              </p>
            ) : null}

            <SubmitButton />
          </form>

          {/* Footer */}
          <div className="pt-2 text-center text-sm">
            <span className="text-slate-500">Já tem uma conta? </span>
            <Link href="/login" className="font-semibold text-[#5C5CFF] hover:underline">
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
