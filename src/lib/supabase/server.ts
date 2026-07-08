/**
 * src/lib/supabase/server.ts
 *
 * Supabase server-side client factory for use inside:
 *  - Server Components
 *  - Server Actions
 *  - Route Handlers
 *
 * Uses @supabase/ssr's `createServerClient` which reads/writes cookies via
 * the Next.js `cookies()` API.  Session tokens are explicitly capped at 7 days
 * via the `cookieOptions` configuration below.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Session token lifetime in seconds: 7 days */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 604 800 s

/**
 * Shared cookie options enforced for every session cookie.
 * - httpOnly:  prevents client-side JS from reading the token.
 * - secure:    HTTPS-only in production.
 * - sameSite:  "lax" is compatible with OAuth redirects.
 * - maxAge:    hard-caps the session lifetime at exactly 7 days.
 */
const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates a Supabase client that is scoped to the current request's cookie
 * store.  Call this at the top of any Server Component, Server Action, or
 * Route Handler that needs database access.
 *
 * @example
 * ```ts
 * import { createSupabaseServerClient } from "@/lib/supabase/server";
 *
 * const supabase = await createSupabaseServerClient();
 * const { data: { user } } = await supabase.auth.getUser();
 * ```
 */
export async function createSupabaseServerClient() {
  // Next.js 15+ returns an async cookie store; await it.
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        /**
         * Read all cookies from the incoming request.
         * @supabase/ssr calls this to locate the session token.
         */
        getAll() {
          return cookieStore.getAll();
        },

        /**
         * Persist session cookies back to the response.
         * Overrides the library defaults with our COOKIE_OPTIONS so the
         * 7-day maxAge is applied on every write.
         */
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: CookieOptions;
          }>
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...COOKIE_OPTIONS,
                // Allow the library to override specific options (e.g., delete)
                ...options,
              });
            });
          } catch {
            // `setAll` can throw if called inside a read-only Server Component
            // context.  This is safe to ignore because the Middleware refreshes
            // the session before the component tree renders.
          }
        },
      },
    }
  );
}

/**
 * Convenience alias — identical to `createSupabaseServerClient()` but reads
 * more semantically in Route Handler and Server Action files.
 */
export const createActionClient = createSupabaseServerClient;
