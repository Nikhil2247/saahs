/**
 * lib/auth/session.ts
 *
 * Our own session mechanism — a signed (HMAC) JWT stored in an httpOnly
 * cookie, replacing Supabase Auth's session cookies entirely.
 *
 * The token only carries the user's `profiles.id` (as `sub`); every request
 * still re-fetches the profile row server-side, so role/membership changes
 * take effect immediately without needing to re-issue a session.
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "saahs_session";
export const OAUTH_STATE_COOKIE_NAME = "saahs_oauth_state";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set.");
  }
  return new TextEncoder().encode(secret);
}

/** Signs a session JWT for the given profile id. Pure — no cookie I/O. */
export async function signSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

/** Verifies a session JWT and returns the user id, or null if invalid/expired. */
export async function verifySessionToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Sets the session cookie on the current request (Server Actions / Route Handlers). */
export async function createSessionCookie(userId: string): Promise<void> {
  const token = await signSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** Reads and verifies the session cookie for the current request. */
export async function getSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const userId = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  return userId ? { userId } : null;
}

/** Clears the session cookie (sign-out). */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
