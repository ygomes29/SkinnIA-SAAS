"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";

import { registerAction, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialState: AuthState = { error: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" disabled={pending} type="submit">
      {pending ? "Criando organização..." : "Criar organização"}
    </Button>
  );
}

export default function RegisterPage() {
  const [state, formAction] = useFormState(registerAction, initialState);

  return (
    <Card className="border-white/10 bg-slate-950/60">
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>
          Cadastre a organização raiz e dispare o onboarding do WhatsApp automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="name">
              Nome da organização
            </label>
            <Input id="name" name="name" placeholder="Studio Lumi" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300" htmlFor="slug">
                Slug
              </label>
              <Input id="slug" name="slug" placeholder="studio-lumi" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300" htmlFor="city">
                Cidade
              </label>
              <Input id="city" name="city" placeholder="Belo Horizonte" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="phone">
              Telefone
            </label>
            <Input id="phone" name="phone" placeholder="(31) 99999-9999" type="tel" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              name="email"
              placeholder="owner@studio.com.br"
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
              minLength={6}
              placeholder="Crie uma senha forte (mínimo 6 caracteres)"
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
            Já tem conta?{" "}
            <Link className="text-pink-300 hover:text-pink-200" href="/login">
              Fazer login
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
