/**
 * middleware.ts  (project root)
 *
 * Next.js Edge Middleware — runs before every matched request.
 *
 * Responsibilities:
 *  1. Refresh the Supabase session token on every request so cookies remain
 *     valid and the 7-day sliding window resets on activity.
 *  2. Guard /dashboard/admin/* routes: require an executive or administrative
 *     role (Executive Body Member and above).
 *  3. Guard /dashboard/student/* routes: require any authenticated session.
 *  4. Guard /onboarding: redirect already-onboarded users away.
 *  5. Redirect unauthenticated requests to the root landing page.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ─── Role constants ───────────────────────────────────────────────────────────

/** Roles that may access the admin dashboard and management routes. */
const ADMIN_ROLES = new Set([
  "Executive Body Member",
  "Governing Body Member",
  "Literary Secretary",
  "Treasurer",
  "General Secretary",
  "Vice President",
  "President",
]);

// ─── Redirects ──────────────────────────────────────────────────────────────
//
// Resolve internal redirect targets against the incoming request's own URL
// (`request.url`) rather than guessing the origin from NEXT_PUBLIC_SITE_URL
// or forwarded headers. This is the pattern Next.js's own docs use, and it
// can never land on an invalid address like "0.0.0.0" — it always reflects
// whatever host actually reached this server.

function getRedirectUrl(dest: string, request: NextRequest): URL {
  return new URL(dest, request.url);
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: CookieOptions;
          }>
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Always use getUser() — validates JWT server-side and refreshes session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── /onboarding ────────────────────────────────────────────────────────────
  if (pathname.startsWith("/onboarding")) {
    if (!user) {
      return NextResponse.redirect(getRedirectUrl("/", request));
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", user.id)
      .single();

    if (profile?.onboarding_complete) {
      return NextResponse.redirect(getRedirectUrl("/dashboard/student", request));
    }
    return response;
  }

  // ── /dashboard/admin/* ────────────────────────────────────────────────────
  if (pathname.startsWith("/dashboard/admin")) {
    if (!user) {
      return NextResponse.redirect(getRedirectUrl("/", request));
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarding_complete")
      .eq("id", user.id)
      .single();

    if (!profile?.onboarding_complete) {
      return NextResponse.redirect(getRedirectUrl("/onboarding", request));
    }
    if (!profile?.role || !ADMIN_ROLES.has(profile.role)) {
      return NextResponse.redirect(getRedirectUrl("/dashboard/student", request));
    }
    return response;
  }

  // ── /dashboard/student/* ──────────────────────────────────────────────────
  if (pathname.startsWith("/dashboard/student")) {
    if (!user) {
      return NextResponse.redirect(getRedirectUrl("/", request));
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", user.id)
      .single();

    if (!profile?.onboarding_complete) {
      return NextResponse.redirect(getRedirectUrl("/onboarding", request));
    }
    return response;
  }

  // ── /dashboard (bare) ─────────────────────────────────────────────────────
  if (pathname === "/dashboard") {
    if (!user) {
      return NextResponse.redirect(getRedirectUrl("/", request));
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarding_complete")
      .eq("id", user.id)
      .single();

    if (!profile?.onboarding_complete) {
      return NextResponse.redirect(getRedirectUrl("/onboarding", request));
    }
    const dest = ADMIN_ROLES.has(profile?.role ?? "")
      ? "/dashboard/admin"
      : "/dashboard/student";

    return NextResponse.redirect(getRedirectUrl(dest, request));
  }

  return response;
}

// ─── Matcher ──────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot|css|js)$).*)",
  ],
};
