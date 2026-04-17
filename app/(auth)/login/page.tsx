"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Asterisk, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";

import { loginAction, type AuthState } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils/cn";

const initialState: AuthState = { error: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className={cn(
        "group relative flex w-full items-center justify-center rounded-xl bg-[#5C5CFF] py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#4B4BFF] hover:shadow-[0_0_20px_rgba(92,92,255,0.3)] disabled:opacity-70",
        pending && "cursor-not-allowed"
      )}
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Entrando...</span>
        </div>
      ) : (
        "Entrar"
      )}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex w-full max-w-[1200px] flex-col overflow-hidden rounded-[32px] bg-white shadow-premium lg:h-[760px] lg:flex-row">
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
      <div className="flex flex-col items-center justify-center bg-white p-8 lg:w-[58%] lg:p-12">
        <div className="w-full max-w-[420px] space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <Asterisk className="h-6 w-6 text-[#5C5CFF]" />
            <h1 className="text-3xl font-bold text-slate-900">Entre na sua conta</h1>
            <p className="max-w-[360px] text-[15px] leading-relaxed text-slate-500">
              Acesse agenda, clientes, atendimentos e automações em um só lugar.
            </p>
          </div>

          {/* Form */}
          <form action={formAction} className="space-y-5">
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
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[15px] text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#5C5CFF] focus:ring-4 focus:ring-[#5C5CFF]/5"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700" htmlFor="password">
                  Senha
                </label>
                <Link href="/esqueci-senha" className="text-xs font-medium text-[#5C5CFF] hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[15px] text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#5C5CFF] focus:ring-4 focus:ring-[#5C5CFF]/5"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {state?.error ? (
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {state.error}
              </p>
            ) : null}

            <SubmitButton />

            {/* Separator */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-slate-400">ou continue com</span>
              </div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                className="flex items-center justify-center rounded-xl bg-slate-50 py-2.5 transition-all hover:bg-slate-100"
              >
                <div className="h-5 w-5 bg-slate-900 rounded-full" /> {/* Apple */}
              </button>
              <button
                type="button"
                className="flex items-center justify-center rounded-xl bg-slate-50 py-2.5 transition-all hover:bg-slate-100"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5 grayscale opacity-70" />
              </button>
              <button
                type="button"
                className="flex items-center justify-center rounded-xl bg-slate-50 py-2.5 transition-all hover:bg-slate-100"
              >
                <div className="h-5 w-5 bg-blue-600 rounded-sm" /> {/* Facebook */}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="pt-2 text-center text-sm">
            <span className="text-slate-500">Não tem uma conta? </span>
            <Link href="/cadastro" className="font-semibold text-[#5C5CFF] hover:underline">
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
