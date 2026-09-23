import { createSupabaseAdminClient } from "@/src/lib/supabase/admin"
import { getSession } from "@/lib/auth/session"
import { UpcomingEventsClient } from "./upcoming-events-client"

export async function UpcomingEvents() {
  const adminSupabase = createSupabaseAdminClient()
  const session = await getSession()
  const isLoggedIn = !!session

  // Fetch upcoming events
  const { data: events } = await adminSupabase
    .from("events")
    .select("*")
    .gte("schedule", new Date().toISOString())
    .order("schedule", { ascending: true })
    .limit(3)

  // Fetch profile + existing registrations if logged in
  const [profileResult, registrationsResult] = await Promise.all([
    session
      ? adminSupabase
          .from("profiles")
          .select("full_name, phone_number, department, course, batch_year, roll_number")
          .eq("id", session.userId)
          .single()
      : Promise.resolve({ data: null }),
    session
      ? adminSupabase
          .from("event_registrations")
          .select("event_id")
          .eq("user_id", session.userId)
      : Promise.resolve({ data: [] }),
  ])

  const profile = profileResult.data
  const registeredEventIds = (registrationsResult.data ?? []).map(
    (r: { event_id: number }) => r.event_id
  )

  return (
    <UpcomingEventsClient
      events={events ?? []}
      isLoggedIn={isLoggedIn}
      profile={{
        full_name: profile?.full_name ?? null,
        department: profile?.department ?? null,
        course: profile?.course ?? null,
        batch_year: profile?.batch_year ?? null,
      }}
      registeredEventIds={registeredEventIds}
    />
  )
}
