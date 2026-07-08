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
  const { searchParams, origin } = new URL(request.url);

  const code  = searchParams.get("code");
  const error = searchParams.get("error");

  // ── OAuth error from Google / Supabase ────────────────────────────────────
  if (error) {
    console.error("[auth/callback] OAuth error:", error, searchParams.get("error_description"));
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    console.error("[auth/callback] Missing authorization code.");
    return NextResponse.redirect(`${origin}/?auth_error=missing_code`);
  }

  // ── Exchange code for session ──────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.user) {
    console.error("[auth/callback] Code exchange failed:", exchangeError);
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent(exchangeError?.message ?? "session_error")}`
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
      ? `${origin}/dashboard`
      : `${origin}/onboarding`;

  return NextResponse.redirect(destination);
}
