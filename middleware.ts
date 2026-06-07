import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export async function middleware(request: NextRequest) {
  // ── Analytics API: block cross-origin POST requests ──────────────────────
  // This prevents external scripts from spamming fake page-view events into
  // your Supabase database. Requests with no Origin header (e.g. server-side
  // calls, sendBeacon on some browsers) are allowed through.
  const isAnalyticsRoute = request.nextUrl.pathname.startsWith("/api/analytics");
  if (isAnalyticsRoute) {
    const origin = request.headers.get("origin") ?? "";
    const host   = request.headers.get("host") ?? "";
    if (origin && !origin.includes(host)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // ── Supabase session handling ────────────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: Partial<ResponseCookie> }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isLoginPage  = request.nextUrl.pathname === "/admin/login";

  // Redirect unauthenticated users away from admin pages.
  if (isAdminRoute && !isLoginPage && !user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // Redirect already-logged-in users away from the login page.
  if (isLoginPage && user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    // Include analytics API routes so the cross-origin check above runs.
    "/api/analytics/:path*",
  ],
};
