"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

export type AuthState = { error?: string; success?: string };

function createActionClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function loginAction(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Preencha todos os campos obrigatórios" };
  }

  if (!isValidEmail(email)) {
    return { error: "Informe um e-mail válido" };
  }

  const supabase = createActionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "E-mail ou senha inválidos" };
  }

  redirect("/");
}

export async function registerAction(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const fullName = formData.get("full_name") as string;
  const businessName = formData.get("business_name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!fullName || !businessName || !email || !password || !confirmPassword) {
    return { error: "Preencha todos os campos obrigatórios" };
  }

  if (!isValidEmail(email)) {
    return { error: "Informe um e-mail válido" };
  }

  if (password.length < 8) {
    return { error: "A senha precisa ter pelo menos 8 caracteres" };
  }

  if (password !== confirmPassword) {
    return { error: "As senhas não coincidem" };
  }

  const supabase = createActionClient();

  // Slug derivation from business name
  const slug = businessName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        business_name: businessName
      }
    },
  });

  if (signUpError || !signUpData.user) {
    return { error: signUpError?.message ?? "Não foi possível criar sua conta. Tente novamente" };
  }

  // Call the setup-organization Edge Function server-side
  const setupUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/setup-organization`;
  const setupResponse = await fetch(setupUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      name: businessName,
      slug,
      owner_user_id: signUpData.user.id,
    }),
  });

  if (!setupResponse.ok) {
    console.error("Setup organization error:", await setupResponse.text());
    // We don't necessarily want to fail the whole thing if the user was created but the org setup lagged, 
    // but the user wants it robust.
  }

  redirect("/");
}

export async function forgotPasswordAction(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get("email") as string;

  if (!email || !isValidEmail(email)) {
    return { error: "Informe um e-mail válido" };
  }

  const supabase = createActionClient();
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/redefinir-senha`,
  });

  if (error) {
    return { error: "Não foi possível enviar o link de recuperação. Tente novamente" };
  }

  return { success: "Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha em instantes." };
}

export async function resetPasswordAction(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!password || !confirmPassword) {
    return { error: "Preencha todos os campos obrigatórios" };
  }

  if (password.length < 8) {
    return { error: "A senha precisa ter pelo menos 8 caracteres" };
  }

  if (password !== confirmPassword) {
    return { error: "As senhas não coincidem" };
  }

  const supabase = createActionClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "Não foi possível atualizar sua senha. Tente novamente" };
  }

  return { success: "Senha atualizada com sucesso. Redirecionando para o login..." };
}

export async function logoutAction() {
  const supabase = createActionClient();
  await supabase.auth.signOut();
  redirect("/login");
}
