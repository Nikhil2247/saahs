import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { StudentGrievancesClient } from "./student-grievances-client";
import type { GrievanceRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function StudentGrievancesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = await createSupabaseServerClient();

  // Fetch grievances submitted by this user
  const { data: grievances, error } = await supabase
    .from("grievances")
    .select("*")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="dashboard-container text-xs text-destructive">
        Failed to load grievances: {error.message}
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <StudentGrievancesClient grievances={(grievances as GrievanceRow[]) || []} />
    </div>
  );
}
