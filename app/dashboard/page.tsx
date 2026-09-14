/**
 * app/dashboard/page.tsx
 *
 * Smart redirect — sends users to the correct sub-dashboard based on their role.
 * Middleware already guards this route (requires auth + onboarding complete).
 * This page performs the final role-based split.
 */

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";

const ADMIN_ROLES = new Set([
  "Executive Body Member",
  "Governing Body Member",
  "Literary Secretary",
  "Treasurer",
  "General Secretary",
  "Vice President",
  "President",
]);

export const dynamic = "force-dynamic";

export default async function DashboardRootPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = createSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_complete")
    .eq("id", session.userId)
    .single();

  if (!profile?.onboarding_complete) redirect("/onboarding");

  if (ADMIN_ROLES.has(profile?.role ?? "")) {
    redirect("/dashboard/admin");
  }

  redirect("/dashboard/student");
}
