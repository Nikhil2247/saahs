/**
 * app/actions/_supabase.ts
 *
 * Re-exports the single canonical Supabase server client factory so every
 * app/actions/*.ts file shares identical cookie handling. Previously this
 * file had its own duplicate client with custom httpOnly/secure/sameSite
 * cookie overrides, which could conflict with @supabase/ssr's own cookie
 * writes (notably the PKCE code_verifier written during signInWithOAuth).
 */

export { createSupabaseServerClient, createSupabaseServerClient as getServerSupabase } from "@/src/lib/supabase/server";
