import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { SportsRegistrationClient } from "./sports-registration-client";
import { getEventTeamsBySport } from "@/app/actions/events";
import type { EventRow } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "SAAHS Sports Festival 2026 — Registration & Team Creation",
  description:
    "Register for the SAAHS Sports Festival 2026. Register for solo events or create a team and add members as captain.",
};

export default async function SportsPage() {
  const session = await getSession();
  const adminSupabase = createSupabaseAdminClient();

  // Find sports event (e.g. SAAHS Sports Festival 2026 - KHEL UTSAV)
  let sportsEvent: EventRow = {
    id: 1,
    title: "SAAHS Sports Festival 2026 - KHEL UTSAV",
    description:
      "Welcome to the annual SAAHS Sports Festival 2026! Compete in thrilling solo and team games. For team events, one player creates the team as Captain and adds squad members. Review rules, select your events, and showcase your skills!",
    category: "Sports",
    banner_url: null,
    schedule: new Date("2026-10-15T09:00:00+05:30").toISOString(),
    venue: "PGIMER Sports Complex, Sector 12, Chandigarh",
    organizer_info: "SAAHS Sports Committee",
    past_archive: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data: eventData } = await adminSupabase
      .from("events")
      .select("*")
      .ilike("title", "%Sports%")
      .order("schedule", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (eventData) {
      sportsEvent = eventData as EventRow;
    }
  } catch (err) {
    console.error("Error fetching sports event:", err);
  }

  // Profile data & existing user registration
  let profile: {
    full_name: string | null;
    phone_number: string | null;
    department: string | null;
    course: string | null;
    batch_year: string | null;
    roll_number: string | null;
    onboarding_complete: boolean;
  } | null = null;
  let userRegistration: any | null = null;

  if (session?.userId) {
    try {
      const [profResult, regResult] = await Promise.all([
        adminSupabase
          .from("profiles")
          .select("full_name, phone_number, department, course, batch_year, roll_number, onboarding_complete")
          .eq("id", session.userId)
          .maybeSingle(),

        adminSupabase
          .from("event_registrations")
          .select("*")
          .eq("event_id", sportsEvent.id)
          .eq("user_id", session.userId)
          .maybeSingle(),
      ]);

      profile = (profResult.data as any) ?? null;
      userRegistration = (regResult.data as any) ?? null;
    } catch (err) {
      console.error("Error fetching user sports profile:", err);
    }
  }


  // Fetch all registered teams grouped per sport
  let teamsBySport: any[] = [];
  try {
    const res = await getEventTeamsBySport(sportsEvent.id);
    if (res.success && res.data) {
      teamsBySport = res.data;
    }
  } catch (err) {
    console.error("Error fetching teams by sport:", err);
  }

  return (
    <main className="min-h-screen bg-background">
      <SportsRegistrationClient
        event={sportsEvent}
        isLoggedIn={Boolean(session?.userId)}
        profile={{
          full_name: profile?.full_name ?? null,
          phone_number: profile?.phone_number ?? null,
          department: profile?.department ?? null,
          course: profile?.course ?? null,
          batch_year: profile?.batch_year ?? null,
          roll_number: profile?.roll_number ?? null,
          onboarding_complete: Boolean(profile?.onboarding_complete),
        }}
        existingRegistration={userRegistration}
        teamsBySport={teamsBySport}
      />
    </main>
  );
}

