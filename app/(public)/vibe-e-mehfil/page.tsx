import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { VibeMehfilRegistrationClient } from "./vibe-mehfil-registration-client";
import { getMehfilGroupsByEvent } from "@/app/actions/vibe-mehfil";
import type { EventRow } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vibe-e-Mehfil — Kaleidoscope Indoor Cultural Events | SAAHS",
  description:
    "Register for Kaleidoscope's Vibe-e-Mehfil — SAAHS's indoor cultural fest. Rangoli, Mehndi, Debate, Stand-up, Skits and more, starting 5th October.",
};

export default async function VibeEMehfilPage() {
  const session = await getSession();
  const adminSupabase = createSupabaseAdminClient();

  // Kaleidoscope — Vibe-e-Mehfil (falls back to a hardcoded event if not yet added in the admin panel)
  let mehfilEvent: EventRow = {
    id: -1,
    title: "Kaleidoscope presents Vibe-e-Mehfil 2026",
    description:
      "Kaleidoscope — The Cultural Club by SAAHS brings you Vibe-e-Mehfil: a series of indoor cultural events where creativity meets competition. From Rangoli to Stand-up, Mehndi to Mystery Murder — there's something for everyone. Different talents, one stage.",
    category: "Cultural",
    banner_url: "/vibe-e-mehfil-banner.jpg",
    schedule: new Date("2026-10-05T14:00:00+05:30").toISOString(),
    venue: "SAAHS Campus, PGIMER (Indoor)",
    organizer_info: "Kaleidoscope — The Cultural Club by SAAHS",
    past_archive: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data: eventData } = await adminSupabase
      .from("events")
      .select("*")
      .ilike("title", "%Vibe-e-Mehfil%")
      .order("schedule", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (eventData) {
      mehfilEvent = eventData as EventRow;
    }
  } catch (err) {
    console.error("Error fetching Vibe-e-Mehfil event:", err);
  }

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
          .eq("event_id", mehfilEvent.id)
          .eq("user_id", session.userId)
          .maybeSingle(),
      ]);

      profile = (profResult.data as any) ?? null;
      userRegistration = (regResult.data as any) ?? null;
    } catch (err) {
      console.error("Error fetching user profile for Vibe-e-Mehfil:", err);
    }
  }

  let eventGroups: any[] = [];
  try {
    const res = await getMehfilGroupsByEvent(mehfilEvent.id);
    if (res.success && res.data) {
      eventGroups = res.data;
    }
  } catch (err) {
    console.error("Error fetching Vibe-e-Mehfil registrations:", err);
  }

  return (
    <main className="min-h-screen bg-background">
      <VibeMehfilRegistrationClient
        event={mehfilEvent}
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
        eventGroups={eventGroups}
      />
    </main>
  );
}
