import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (err) {
            // In production, cookie-setting can legitimately fail when called
            // from a Server Component (cookies are read-only there). Suppress
            // the error in production but surface it in development so you
            // can catch real auth session bugs early.
            if (process.env.NODE_ENV === "development") {
              console.warn("[Supabase SSR] Could not set cookies:", err);
            }
          }
        },
      },
    }
  );
}
