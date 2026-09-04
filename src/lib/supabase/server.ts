/**
 * src/lib/supabase/server.ts
 *
 * Supabase server-side client factory for use inside:
 *  - Server Components
 *  - Server Actions
 *  - Route Handlers
 *
 * Uses @supabase/ssr's `createServerClient` which reads/writes cookies via
 * the Next.js `cookies()` API, using the library's own cookie options as-is.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// ─── Factory ──────────────────────────────────────────────────────────────────
//
// IMPORTANT: cookie options are passed straight through from @supabase/ssr,
// exactly as the library provides them, with no overrides. Supabase writes
// several different cookies during the auth flow (the long-lived session
// token, and — critically — a short-lived PKCE `code_verifier` cookie during
// signInWithOAuth()). Forcing our own httpOnly/secure/sameSite/maxAge on top
// of the library's own choices previously broke this: it made the session
// cookie httpOnly (unreadable by the client-side createBrowserClient(), which
// needs to read/refresh it) and it force-set `secure: true` in every build
// where NODE_ENV === "production" (i.e. any `next start`), which makes the
// browser silently drop the cookie whenever the app is reached over plain
// HTTP — producing exactly the "PKCE code verifier not found in storage"
// error. Trust the library; it already sets sane per-cookie options.

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
         * Persist session cookies back to the response, using exactly the
         * options @supabase/ssr passes in — see note above.
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
              cookieStore.set(name, value, options);
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
