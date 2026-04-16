"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";

import { loginAction, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialState: AuthState = { error: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" disabled={pending} type="submit">
      {pending ? "Entrando..." : "Entrar"}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <Card className="border-white/10 bg-slate-950/60">
      <CardHeader>
        <CardTitle>Acessar painel</CardTitle>
        <CardDescription>
          Entre com email e senha para abrir o dashboard da sua operação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              name="email"
              placeholder="voce@studio.com.br"
              required
              type="email"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="password">
              Senha
            </label>
            <Input
              id="password"
              name="password"
              placeholder="Sua senha"
              required
              type="password"
            />
          </div>

          {state?.error ? (
            <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {state.error}
            </p>
          ) : null}

          <SubmitButton />

          <p className="text-sm text-slate-400">
            Ainda não tem conta?{" "}
            <Link className="text-pink-300 hover:text-pink-200" href="/register">
              Criar organização
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
