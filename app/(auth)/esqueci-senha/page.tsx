"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Asterisk, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

import { forgotPasswordAction, type AuthState } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils/cn";

const initialState: AuthState = {};

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
          <span>Enviando link...</span>
        </div>
      ) : (
        "Enviar link de recuperação"
      )}
    </button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useFormState(forgotPasswordAction, initialState);

  return (
    <div className={cn(
      "flex w-full max-w-[1200px] flex-col overflow-hidden rounded-[32px] lg:h-[760px] lg:flex-row",
      "bg-[var(--sk-bg-card)] shadow-premium"
    )}>
      {/* Left Column: Visual Panel */}
      <div className="relative flex min-h-[300px] flex-col justify-between p-10 lg:w-[42%] lg:p-12">
        <div className="absolute inset-0 z-0 bg-auth-gradient opacity-90" />
        <div className="absolute inset-0 z-0 bg-white/10 backdrop-blur-[2px]" />

        <div className="relative z-10">
          <Asterisk className="h-8 w-8 text-white" />
        </div>

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
      <div className="flex flex-col items-center justify-center bg-white p-8 lg:w-[58%] lg:p-12">
        <div className="w-full max-w-[420px] space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <Asterisk className="h-6 w-6 text-[#5C5CFF]" />
            <h1 className="text-3xl font-bold text-slate-900">Recuperar acesso</h1>
            <p className="max-w-[360px] text-[15px] leading-relaxed text-slate-500">
              Informe seu e-mail e enviaremos um link para você redefinir sua senha com segurança.
            </p>
          </div>

          {state?.success ? (
            <div className={cn(
              "rounded-2xl border p-6 text-center space-y-4",
              "border-[var(--sk-success-border)] bg-[var(--sk-success-bg)]"
            )}>
              <div className="flex justify-center">
                <CheckCircle2 className="h-10 w-10 text-[var(--sk-success)]" />
              </div>
              <p className="text-sm font-medium text-[var(--sk-text-primary)] leading-relaxed">
                {state.success}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#5C5CFF] hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para login
              </Link>
            </div>
          ) : (
            <form action={formAction} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700" htmlFor="email">
                  Seu e-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="exemplo@email.com"
                  required
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-[15px] outline-none transition-all",
                    "border-slate-200 bg-white text-slate-900",
                    "placeholder:text-slate-400",
                    "focus:border-[#5C5CFF] focus:ring-4 focus:ring-[#5C5CFF]/5"
                  )}
                />
              </div>

              {state?.error ? (
                <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {state.error}
                </p>
              ) : null}

              <SubmitButton />

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#5C5CFF] transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
