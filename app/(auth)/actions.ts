"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

export type AuthState = { error: string };

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

export async function loginAction(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios." };
  }

  const supabase = createActionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Credenciais inválidas. Verifique seu email e senha." };
  }

  redirect("/");
}

export async function registerAction(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const city = formData.get("city") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !slug || !email || !password) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  const supabase = createActionClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (signUpError || !signUpData.user) {
    return { error: signUpError?.message ?? "Erro ao criar conta." };
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
      name,
      slug,
      city: city || "",
      phone: phone || "",
      owner_user_id: signUpData.user.id,
    }),
  });

  if (!setupResponse.ok) {
    const body = await setupResponse.json().catch(() => ({})) as { error?: string };
    return { error: body.error ?? "Erro ao configurar organização." };
  }

  redirect("/");
}

export async function logoutAction() {
  const supabase = createActionClient();
  await supabase.auth.signOut();
  redirect("/login");
}
