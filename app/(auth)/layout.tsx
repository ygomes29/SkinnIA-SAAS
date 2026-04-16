import type { ReactNode } from "react";

export default function AuthLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.15fr_0.85fr]">
      <section className="hidden bg-hero-radial px-10 py-12 lg:flex lg:flex-col lg:justify-between">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-pink to-brand-purple text-lg font-bold text-white">
            S
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">SkinnIA</p>
            <h1 className="text-lg font-semibold text-white">Automação para beleza</h1>
          </div>
        </div>

        <div className="max-w-xl">
          <p className="text-sm uppercase tracking-[0.24em] text-pink-200/70">Beauty Ops</p>
          <h2 className="mt-4 text-5xl font-semibold leading-tight text-white">
            Agenda, cobrança, WhatsApp e retenção rodando no mesmo fluxo.
          </h2>
          <p className="mt-6 max-w-lg text-lg text-slate-300">
            Painel multi-tenant pensado para clínicas, salões e studios que precisam operar rápido
            sem perder contexto da cliente.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["+32%", "taxa de confirmação"],
            ["-41%", "no-show"],
            ["24/7", "roteador WhatsApp"]
          ].map(([value, label]) => (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5" key={label}>
              <p className="text-3xl font-semibold text-white">{value}</p>
              <p className="mt-2 text-sm text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </div>
  );
}
