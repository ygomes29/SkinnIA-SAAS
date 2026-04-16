import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  const cookieStore = cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }>
      ) {
        try {
          const mutableCookieStore = cookieStore as unknown as {
            set: (name: string, value: string, options?: Record<string, unknown>) => void;
          };
          cookiesToSet.forEach(({ name, value, options }) => {
            mutableCookieStore.set(name, value, options);
          });
        } catch {
          // Server Components can read cookies in render, but write access is not always available.
        }
      }
    }
  });
}
