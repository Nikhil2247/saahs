/**
 * src/lib/supabase/admin.ts
 *
 * Service-role Supabase client factory — SERVER-ONLY.
 *
 * Since authentication is now handled entirely by our own Google OAuth +
 * session cookie (see lib/auth/session.ts), there is no Supabase-issued JWT
 * for Postgres RLS policies to key off `auth.uid()` with. This client uses
 * the service_role key, which bypasses RLS entirely; every server action and
 * server component that needs privileged data access should use it, and
 * enforce authorization in application code (checking the caller's role from
 * `profiles`, as the codebase already does in most places).
 *
 * NEVER import this file from a "use client" component or route that runs in
 * the browser — the service_role key must never reach the client bundle.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

let _client: ReturnType<typeof createClient<Database>> | null = null;

export function createSupabaseAdminClient() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
      );
    }

    _client = createClient<Database>(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _client;
}
