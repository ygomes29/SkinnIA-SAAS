import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const publicRoutes = new Set(["/login", "/cadastro", "/esqueci-senha", "/redefinir-senha", "/onboarding", "/auth/callback"]);

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Sem env vars configuradas: protege todas as rotas não-públicas
    if (!publicRoutes.has(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }>
      ) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Auth checks
  if (!user && !publicRoutes.has(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && publicRoutes.has(pathname) && pathname !== "/onboarding") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Onboarding check
  if (user && pathname !== "/onboarding" && !pathname.startsWith("/api")) {
    const { data: orgUser } = await supabase
      .from("organization_users")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (orgUser) {
      const { data: progress } = await supabase
        .from("onboarding_progress")
        .select("status")
        .eq("tenant_id", orgUser.organization_id)
        .eq("status", "completed");

      const completedSteps = progress?.length ?? 0;

      if (completedSteps < 7) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }
  }

  return response;
}

// Helper for new middleware pattern
export function createSupabaseMiddlewareClient(request: NextRequest) {
  const response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  return { supabase, response };
}
