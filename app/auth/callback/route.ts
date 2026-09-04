/**
 * app/auth/callback/route.ts
 *
 * OAuth Callback Route Handler — lives in the Next.js App Router root.
 *
 * Supabase redirects here after the Google OAuth consent screen.
 * 1. Exchanges the authorization code for a Supabase session.
 * 2. Checks whether the user has completed the onboarding questionnaire.
 * 3. Routes → /onboarding (first-time) or /dashboard (returning user).
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

// Resolve redirects against the incoming request's own URL — this always
// reflects whatever host actually reached the server, so it can never
// produce an invalid address like "0.0.0.0" the way env/header guessing can.
function redirectTo(path: string, request: NextRequest) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get("code");
  const error = searchParams.get("error");

  // ── OAuth error bubbled back from Google/Supabase ──────────────────────────
  if (error) {
    console.error("[auth/callback] OAuth error:", error, searchParams.get("error_description"));
    return redirectTo(`/?auth_error=${encodeURIComponent(error)}`, request);
  }

  if (!code) {
    console.error("[auth/callback] Missing authorization code.");
    return redirectTo("/?auth_error=missing_code", request);
  }

  const supabase = await createSupabaseServerClient();

  // ── Exchange authorization code for a session ──────────────────────────────
  const { data, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.user) {
    console.error("[auth/callback] Code exchange failed:", exchangeError?.message);
    return redirectTo(
      `/?auth_error=${encodeURIComponent(exchangeError?.message ?? "session_error")}`,
      request
    );
  }

  // ── Check onboarding status ────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", data.user.id)
    .single();

  // First-time users → onboarding; returning users → dashboard (middleware decides sub-path)
  return redirectTo(
    profile?.onboarding_complete === true ? "/dashboard" : "/onboarding",
    request
  );
}
