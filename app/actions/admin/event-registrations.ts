"use server";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";

export interface EventRegistrationDetail {
  id: number;
  registered_at: string;
  sport_choices: string[];
  phone_number: string | null;
  waiver_accepted: boolean;
  profile: {
    full_name: string | null;
    email: string;
    department: string | null;
    course: string | null;
    batch_year: string | null;
    roll_number: string | null;
  };
}

/**
 * Fetch all registrations for a given event.
 * Admin-only: requires Executive Body Member or above role.
 */
export async function getEventRegistrations(
  eventId: number
): Promise<{ success: boolean; data?: EventRegistrationDetail[]; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createSupabaseAdminClient();

  // Verify admin role
  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.userId)
    .single();

  const adminRoles = new Set([
    "Executive Body Member",
    "Governing Body Member",
    "Literary Secretary",
    "Treasurer",
    "General Secretary",
    "Vice President",
    "President",
    "Faculty",
  ]);

  if (!callerProfile?.role || !adminRoles.has(callerProfile.role)) {
    return { success: false, error: "Insufficient permissions." };
  }

  const { data, error } = await supabase
    .from("event_registrations")
    .select(
      `id, registered_at, sport_choices, phone_number, waiver_accepted,
       profiles:user_id (full_name, email, department, course, batch_year, roll_number)`
    )
    .eq("event_id", eventId)
    .order("registered_at", { ascending: true });

  if (error) return { success: false, error: error.message };

  const registrations: EventRegistrationDetail[] = (data || []).map((row: any) => ({
    id: row.id,
    registered_at: row.registered_at,
    sport_choices: row.sport_choices ?? [],
    phone_number: row.phone_number,
    waiver_accepted: row.waiver_accepted,
    profile: {
      full_name: row.profiles?.full_name ?? null,
      email: row.profiles?.email ?? "",
      department: row.profiles?.department ?? null,
      course: row.profiles?.course ?? null,
      batch_year: row.profiles?.batch_year ?? null,
      roll_number: row.profiles?.roll_number ?? null,
    },
  }));

  return { success: true, data: registrations };
}
