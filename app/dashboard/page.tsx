/**
 * app/dashboard/page.tsx
 *
 * Smart redirect — sends users to the correct sub-dashboard based on their role.
 * Middleware already guards this route (requires auth + onboarding complete).
 * This page performs the final role-based split.
 */

import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const ADMIN_ROLES = new Set([
  "Executive Body Member",
  "Governing Body Member",
  "Literary Secretary",
  "Treasurer",
  "General Secretary",
  "Vice President",
  "President",
]);

async function getServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs: Array<{ name: string; value: string; options?: CookieOptions }>) => {
          try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* ignored in server component */ }
        },
      },
    }
  );
}

export const dynamic = "force-dynamic";

export default async function DashboardRootPage() {
  const supabase = await getServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_complete")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_complete) redirect("/onboarding");

  if (ADMIN_ROLES.has(profile?.role ?? "")) {
    redirect("/dashboard/admin");
  }

  redirect("/dashboard/student");
}
