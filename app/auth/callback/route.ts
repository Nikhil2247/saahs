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
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

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

  // ── OAuth error bubbled back from Google/Supabase ──────────────────────────
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

  // ── Create a Supabase client with cookie write access ──────────────────────
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: SESSION_MAX_AGE,
                ...options,
              });
            } catch {
              // Safe to ignore in Route Handler context
            }
          });
        },
      },
    }
  );

  // ── Exchange authorization code for a session ──────────────────────────────
  const { data, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.user) {
    console.error("[auth/callback] Code exchange failed:", exchangeError?.message);
    return NextResponse.redirect(
      `${baseUrl}/?auth_error=${encodeURIComponent(
        exchangeError?.message ?? "session_error"
      )}`
    );
  }

  // ── Check onboarding status ────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", data.user.id)
    .single();

  // First-time users → onboarding; returning users → dashboard (middleware decides sub-path)
  const destination =
    profile?.onboarding_complete === true
      ? `${baseUrl}/dashboard`
      : `${baseUrl}/onboarding`;

  return NextResponse.redirect(destination);
}
