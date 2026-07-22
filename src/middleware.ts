// @ts-nocheck
/**
 * src/middleware.ts
 *
 * Next.js Edge Middleware — runs before every matched request.
 *
 * Responsibilities:
 *  1. Refresh the Supabase session token on every request so cookies remain
 *     valid and the 7-day sliding window resets on activity.
 *  2. Guard /dashboard/admin/* routes: require an executive or administrative
 *     role (Executive Body Member and above).
 *  3. Guard /dashboard/student/* routes: require any authenticated session.
 *  4. Guard /onboarding route: redirect already-onboarded users away.
 *  5. Redirect unauthenticated requests to the root landing page.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

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
] as const);

// ─── Cookie options (mirrors server.ts) ──────────────────────────────────────

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const COOKIE_DEFAULTS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

function getRedirectUrl(dest: string, request: NextRequest): URL {
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (!siteUrl) {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || request.nextUrl.host;
    const proto = request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "");
    siteUrl = `${proto}://${host}`;
  }

  if (siteUrl.includes("0.0.0.0")) {
    siteUrl = siteUrl.replace(/0\.0\.0\.0/g, "localhost");
  }

  return new URL(dest, siteUrl);
}

export async function middleware(request: NextRequest) {
  // Start with a passthrough response so we can mutate cookies on it.
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Build a Supabase client that reads/writes the request/response cookies.
  const supabase = createServerClient<Database>(
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
          // Write to both the request (so the server sees them) and the
          // response (so the browser receives the refreshed token).
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          // Rebuild response with updated request headers
          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...COOKIE_DEFAULTS,
              ...options,
            });
          });
        },
      },
    }
  );

  // IMPORTANT: Always call getUser() (not getSession()) — getUser() validates
  // the JWT server-side and refreshes the session token automatically.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Route: /onboarding ────────────────────────────────────────────────────
  // Only accessible to authenticated users who have NOT yet completed onboarding.
  if (pathname.startsWith("/onboarding")) {
    if (!user) {
      // Not logged in — send to root
      return NextResponse.redirect(getRedirectUrl("/", request));
    }

    // Check if the user has already completed onboarding
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", user.id)
      .single();

    if (profile?.onboarding_complete === true) {
      // Already onboarded — redirect to student dashboard
      return NextResponse.redirect(getRedirectUrl("/dashboard/student", request));
    }

    return response;
  }

  // ── Route: /dashboard/admin/* ─────────────────────────────────────────────
  if (pathname.startsWith("/dashboard/admin")) {
    if (!user) {
      return NextResponse.redirect(getRedirectUrl("/", request));
    }

    // Fetch the caller's role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarding_complete")
      .eq("id", user.id)
      .single();

    // If onboarding is incomplete, redirect there first
    if (!profile?.onboarding_complete) {
      return NextResponse.redirect(getRedirectUrl("/onboarding", request));
    }

    // Deny access if not an admin role
    if (!profile?.role || !ADMIN_ROLES.has(profile.role as any)) {
      return NextResponse.redirect(getRedirectUrl("/dashboard/student", request));
    }

    return response;
  }

  // ── Route: /dashboard/student/* ───────────────────────────────────────────
  if (pathname.startsWith("/dashboard/student")) {
    if (!user) {
      return NextResponse.redirect(getRedirectUrl("/", request));
    }

    // Check onboarding completion
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

  // ── Route: /dashboard (bare) ──────────────────────────────────────────────
  if (pathname === "/dashboard") {
    if (!user) {
      return NextResponse.redirect(getRedirectUrl("/", request));
    }
    // Redirect to the appropriate sub-dashboard based on role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarding_complete")
      .eq("id", user.id)
      .single();

    if (!profile?.onboarding_complete) {
      return NextResponse.redirect(getRedirectUrl("/onboarding", request));
    }

    const destination = ADMIN_ROLES.has(profile?.role as any)
      ? "/dashboard/admin"
      : "/dashboard/student";

    return NextResponse.redirect(getRedirectUrl(destination, request));
  }

  // ── All other routes ───────────────────────────────────────────────────────
  // Pass through, but the session has already been refreshed above.
  return response;
}

// ─── Matcher configuration ───────────────────────────────────────────────────

/**
 * Run middleware on all routes except:
 *  - Next.js static assets (_next/static, _next/image)
 *  - Public asset files (favicon, images, etc.)
 *  - API routes that handle their own auth (e.g., /api/auth/*)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     * - Public media assets
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot|css|js)$).*)",
  ],
};
