/**
 * app/actions/_supabase.ts
 *
 * Shared server-side Supabase client factory for all app/actions/*.ts files.
 * Inline here to avoid cross-directory import issues.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (
          cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>
        ) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: SESSION_MAX_AGE,
                ...options,
              })
            );
          } catch { /* Ignore read-only context errors — middleware handles refresh */ }
        },
      },
    }
  );
}

/** Alias used by action files */
export const createSupabaseServerClient = getServerSupabase;
