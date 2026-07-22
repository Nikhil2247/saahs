/**
 * src/app/auth/callback/route.ts
 *
 * OAuth Callback Route Handler
 *
 * Supabase redirects here after the Google OAuth consent screen.
 * This handler:
 *  1. Exchanges the authorization `code` for a session.
 *  2. Checks whether the user has completed onboarding.
 *  3. Redirects to /onboarding (first-time) or /dashboard (returning user).
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;

  const code  = searchParams.get("code");
  const error = searchParams.get("error");

  let baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (!baseUrl) {
    const hostHeader = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const protoHeader = request.headers.get("x-forwarded-proto");
    const proto = protoHeader || (process.env.NODE_ENV === "production" ? "https" : "http");
    baseUrl = hostHeader ? `${proto}://${hostHeader}` : requestUrl.origin;
  }

  if (baseUrl.includes("0.0.0.0")) {
    baseUrl = baseUrl.replace(/0\.0\.0\.0/g, "localhost");
  }

  // ── OAuth error from Google / Supabase ────────────────────────────────────
  if (error) {
    console.error("[auth/callback] OAuth error:", error, searchParams.get("error_description"));
    return NextResponse.redirect(
      `${baseUrl}/?auth_error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    console.error("[auth/callback] Missing authorization code.");
    return NextResponse.redirect(`${baseUrl}/?auth_error=missing_code`);
  }

  // ── Exchange code for session ──────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.user) {
    console.error("[auth/callback] Code exchange failed:", exchangeError);
    return NextResponse.redirect(
      `${baseUrl}/?auth_error=${encodeURIComponent(exchangeError?.message ?? "session_error")}`
    );
  }

  // ── Check onboarding status ────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", data.user.id)
    .single();

  const destination =
    profile?.onboarding_complete === true
      ? `${baseUrl}/dashboard`
      : `${baseUrl}/onboarding`;

  return NextResponse.redirect(destination);
}
