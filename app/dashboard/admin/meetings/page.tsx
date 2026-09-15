import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { MeetingsClient } from "./meetings-client";
import type { MeetingRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminMeetingsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: meetings, error } = await supabase
    .from("meetings")
    .select("*")
    .order("notice_date", { ascending: false });

  if (error) {
    return (
      <div className="dashboard-container text-xs text-destructive">
        Failed to load meetings: {error.message}
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <MeetingsClient meetings={(meetings as MeetingRow[]) || []} />
    </div>
  );
}
