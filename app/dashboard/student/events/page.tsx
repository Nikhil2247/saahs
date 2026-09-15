import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import { StudentEventsClient } from "./student-events-client";
import type { EventRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function StudentEventsPage() {
  const session = await getSession();
  const supabase = await createSupabaseServerClient();

  const [{ data: events, error }, { data: registrations }] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .order("schedule", { ascending: true }),
    session
      ? supabase
          .from("event_registrations")
          .select("event_id")
          .eq("user_id", session.userId)
      : Promise.resolve({ data: [] }),
  ]);

  if (error) {
    return (
      <div className="dashboard-container text-xs text-destructive">
        Failed to load events: {error.message}
      </div>
    );
  }

  const registeredEventIds = (registrations || []).map((r) => r.event_id);

  return (
    <div className="dashboard-container">
      <StudentEventsClient
        events={(events as EventRow[]) || []}
        registeredEventIds={registeredEventIds}
      />
    </div>
  );
}
