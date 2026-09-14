/**
 * lib/auth/google.ts
 *
 * Minimal, hand-rolled Google OAuth 2.0 (Authorization Code flow) — no
 * Supabase Auth, no third-party auth framework.
 *
 * Flow:
 *  1. buildGoogleAuthUrl()      → redirect the browser here to start login.
 *  2. exchangeCodeForTokens()   → called in /auth/callback with the `code`.
 *  3. verifyGoogleIdToken()     → cryptographically verifies the returned
 *     ID token against Google's published JWKS (never trust a decoded-but-
 *     unverified payload for identity).
 */

import { createRemoteJWKSet, jwtVerify } from "jose";

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getGoogleJwks() {
  if (!_jwks) {
    _jwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));
  }
  return _jwks;
}

function getClientCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET environment variables are not set.");
  }
  return { clientId, clientSecret };
}

/** Builds the URL to redirect the browser to for Google's consent screen. */
export function buildGoogleAuthUrl(state: string, redirectUri: string): string {
  const { clientId } = getClientCredentials();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}

/** Exchanges an authorization code for tokens (including the ID token). */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = getClientCredentials();

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Google token exchange failed (${response.status}): ${text}`);
  }

  return response.json();
}

export interface GoogleIdentity {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
}

/** Verifies a Google ID token's signature, issuer, audience and expiry. */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdentity> {
  const { clientId } = getClientCredentials();

  const { payload } = await jwtVerify(idToken, getGoogleJwks(), {
    issuer: GOOGLE_ISSUERS,
    audience: clientId,
  });

  if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
    throw new Error("Google ID token is missing required claims.");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === "string" ? payload.name : null,
    picture: typeof payload.picture === "string" ? payload.picture : null,
  };
}
