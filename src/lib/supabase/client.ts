/**
 * src/lib/supabase/client.ts
 *
 * Supabase browser-side client singleton for use inside:
 *  - Client Components ("use client")
 *  - Custom React hooks
 *
 * Uses @supabase/ssr's `createBrowserClient` which handles cookie
 * management automatically in the browser environment.
 *
 * @example
 * ```tsx
 * "use client";
 * import { supabaseBrowserClient } from "@/lib/supabase/client";
 *
 * const { data } = await supabaseBrowserClient
 *   .from("events")
 *   .select("*")
 *   .eq("past_archive", false);
 * ```
 */

import { createBrowserClient } from "@supabase/ssr";

// ─── Singleton ────────────────────────────────────────────────────────────────

let _client: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Returns a lazily-initialised, module-level singleton Supabase browser client.
 *
 * Using a singleton prevents redundant client creation on every re-render
 * while remaining compatible with React's strict-mode double invocation.
 */
export function getSupabaseBrowserClient() {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
  }
  return _client;
}

/**
 * Named export for ergonomic destructuring in hooks:
 * `const supabase = supabaseBrowserClient;`
 */
export const supabaseBrowserClient = getSupabaseBrowserClient();
