import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { StudentEventsClient } from "./student-events-client";
import type { EventRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function StudentEventsPage() {
  const session = await getSession();
  const supabase = await createSupabaseServerClient();
  const adminSupabase = createSupabaseAdminClient();

  const [{ data: events, error }, { data: registrations }, { data: profile }] =
    await Promise.all([
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

      session
        ? adminSupabase
            .from("profiles")
            .select("full_name, phone_number, department, course, batch_year, roll_number")
            .eq("id", session.userId)
            .single()
        : Promise.resolve({ data: null }),
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
        profile={{
          full_name: profile?.full_name ?? null,
          phone_number: profile?.phone_number ?? null,
          department: profile?.department ?? null,
          course: profile?.course ?? null,
          batch_year: profile?.batch_year ?? null,
          roll_number: profile?.roll_number ?? null,
        }}
      />
    </div>
  );
}
