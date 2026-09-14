/**
 * app/auth/callback/route.ts
 *
 * OAuth Callback Route Handler — Google redirects here after consent.
 *
 * 1. Validates the CSRF `state` against the cookie set in signInWithGoogle().
 * 2. Exchanges the authorization code for tokens and verifies the ID token.
 * 3. Upserts a `profiles` row keyed by the Google account id (`google_id`).
 * 4. Issues our own session cookie.
 * 5. Routes → /onboarding (first-time) or /dashboard (returning user).
 */

import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { exchangeCodeForTokens, verifyGoogleIdToken } from "@/lib/auth/google";
import { createSessionCookie, OAUTH_STATE_COOKIE_NAME } from "@/lib/auth/session";
import { resolveSiteUrl } from "@/lib/site-url";

async function redirectTo(path: string) {
  return NextResponse.redirect(new URL(path, await resolveSiteUrl()));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  if (error) {
    console.error("[auth/callback] OAuth error:", error, searchParams.get("error_description"));
    return redirectTo(`/login?auth_error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    console.error("[auth/callback] Missing authorization code or state.");
    return redirectTo("/login?auth_error=missing_code");
  }

  // ── CSRF check: state must match the cookie we set before redirecting to Google ──
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE_NAME);

  if (!expectedState || expectedState !== state) {
    console.error("[auth/callback] OAuth state mismatch.");
    return redirectTo("/login?auth_error=invalid_state");
  }

  try {
    const siteUrl = await resolveSiteUrl();
    const redirectUri = `${siteUrl}/auth/callback`;

    // ── Exchange code for tokens, then verify the ID token's signature ──────────
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const identity = await verifyGoogleIdToken(tokens.id_token);

    if (!identity.emailVerified) {
      return redirectTo("/login?auth_error=email_not_verified");
    }

    const supabase = createSupabaseAdminClient();

    // ── Find an existing profile by Google id, else create one ──────────────────
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, onboarding_complete")
      .eq("google_id", identity.sub)
      .maybeSingle();

    let profileId: string;
    let onboardingComplete: boolean;

    if (existingProfile) {
      profileId = existingProfile.id;
      onboardingComplete = existingProfile.onboarding_complete;

      // Keep name/avatar in sync with Google on every login.
      await supabase
        .from("profiles")
        .update({
          full_name: identity.name ?? undefined,
          avatar_url: identity.picture ?? undefined,
        })
        .eq("id", profileId);
    } else {
      profileId = randomUUID();
      onboardingComplete = false;

      const { error: insertError } = await supabase.from("profiles").insert({
        id: profileId,
        google_id: identity.sub,
        email: identity.email,
        full_name: identity.name,
        avatar_url: identity.picture,
      });

      if (insertError) {
        console.error("[auth/callback] Failed to create profile:", insertError);
        return redirectTo(`/login?auth_error=${encodeURIComponent("profile_create_failed")}`);
      }
    }

    await createSessionCookie(profileId);

    return redirectTo(onboardingComplete ? "/dashboard" : "/onboarding");
  } catch (err) {
    console.error("[auth/callback] Unexpected error:", err);
    return redirectTo("/login?auth_error=session_error");
  }
}
