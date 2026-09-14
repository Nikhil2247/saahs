/**
 * middleware.ts  (project root)
 *
 * Next.js Middleware — runs before every matched request.
 *
 * Responsibilities:
 *  1. Verify our own session cookie (see lib/auth/session.ts) — no Supabase Auth.
 *  2. Guard /dashboard/admin/* routes: require an executive or administrative
 *     role (Executive Body Member and above).
 *  3. Guard /dashboard/student/* routes: require any authenticated session.
 *  4. Guard /onboarding: redirect already-onboarded users away.
 *  5. Redirect unauthenticated requests to the root landing page.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { jwtVerify } from "jose";
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
]);

const SESSION_COOKIE_NAME = "saahs_session";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRedirectUrl(dest: string, request: NextRequest): URL {
  return new URL(dest, request.url);
}

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

// Edge-safe: a plain service-role client with no cookie/session plumbing.
function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userId = await getUserIdFromRequest(request);

  // ── /onboarding ────────────────────────────────────────────────────────────
  if (pathname.startsWith("/onboarding")) {
    if (!userId) {
      return NextResponse.redirect(getRedirectUrl("/", request));
    }
    const supabase = getAdminClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", userId)
      .single();

    if (profile?.onboarding_complete) {
      return NextResponse.redirect(getRedirectUrl("/dashboard/student", request));
    }
    return NextResponse.next();
  }

  // ── /dashboard/admin/* ────────────────────────────────────────────────────
  if (pathname.startsWith("/dashboard/admin")) {
    if (!userId) {
      return NextResponse.redirect(getRedirectUrl("/", request));
    }
    const supabase = getAdminClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarding_complete")
      .eq("id", userId)
      .single();

    if (!profile?.onboarding_complete) {
      return NextResponse.redirect(getRedirectUrl("/onboarding", request));
    }
    if (!profile?.role || !ADMIN_ROLES.has(profile.role)) {
      return NextResponse.redirect(getRedirectUrl("/dashboard/student", request));
    }
    return NextResponse.next();
  }

  // ── /dashboard/student/* ──────────────────────────────────────────────────
  if (pathname.startsWith("/dashboard/student")) {
    if (!userId) {
      return NextResponse.redirect(getRedirectUrl("/", request));
    }
    const supabase = getAdminClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", userId)
      .single();

    if (!profile?.onboarding_complete) {
      return NextResponse.redirect(getRedirectUrl("/onboarding", request));
    }
    return NextResponse.next();
  }

  // ── /dashboard (bare) ─────────────────────────────────────────────────────
  if (pathname === "/dashboard") {
    if (!userId) {
      return NextResponse.redirect(getRedirectUrl("/", request));
    }
    const supabase = getAdminClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarding_complete")
      .eq("id", userId)
      .single();

    if (!profile?.onboarding_complete) {
      return NextResponse.redirect(getRedirectUrl("/onboarding", request));
    }
    const dest = ADMIN_ROLES.has(profile?.role ?? "")
      ? "/dashboard/admin"
      : "/dashboard/student";

    return NextResponse.redirect(getRedirectUrl(dest, request));
  }

  return NextResponse.next();
}

// ─── Matcher ──────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot|css|js)$).*)",
  ],
};
