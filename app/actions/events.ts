"use server";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

import { SPORTS_LIST } from "@/lib/sports-constants";
import type { TeamMember } from "@/types/database";

export { SPORTS_LIST };

export interface RegisterEventPayload {
  sportChoices?: string[];
  waiverAccepted?: boolean;
  isSportsEvent?: boolean;
  phoneNumber?: string;
  registrationType?: "solo" | "team";
  teamName?: string;
  isCaptain?: boolean;
  teamMembers?: TeamMember[];
}

/**
 * Register an onboarded student for an event.
 * For Sports category events, supports both Solo registrations and
 * Team registrations (where one student creates a team, acts as Captain,
 * and adds team members).
 */
export async function registerForEvent(
  eventId: number,
  payload: RegisterEventPayload
) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Please log in to register for events." };
  }

  const supabase = createSupabaseAdminClient();

  // Verify onboarding is complete
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone_number, department, course, batch_year, roll_number, onboarding_complete")
    .eq("id", session.userId)
    .single();

  if (!profile?.onboarding_complete) {
    return {
      success: false,
      error: "Please complete your profile onboarding before registering.",
    };
  }

  // For sports events, waiver is mandatory
  if (payload.isSportsEvent && !payload.waiverAccepted) {
    return {
      success: false,
      error: "You must accept the liability waiver to register.",
    };
  }

  if (payload.isSportsEvent && (!payload.sportChoices || payload.sportChoices.length === 0)) {
    return {
      success: false,
      error: "Please select at least one sport/event to register for.",
    };
  }

  // Team registration validations
  const isTeam = payload.registrationType === "team" || Boolean(payload.teamName);
  let teamMembers = payload.teamMembers || [];

  if (isTeam) {
    if (!payload.teamName || !payload.teamName.trim()) {
      return { success: false, error: "Please provide a name for your team." };
    }

    // Ensure Captain is in the team roster
    const captainAlreadyInList = teamMembers.some((m) => m.is_captain);
    if (!captainAlreadyInList) {
      teamMembers = [
        {
          name: profile.full_name || "Captain",
          roll_number: profile.roll_number || undefined,
          department: profile.department || profile.course || undefined,
          phone: payload.phoneNumber || profile.phone_number || undefined,
          is_captain: true,
        },
        ...teamMembers,
      ];
    }
  }

  const baseInsert: Record<string, any> = {
    event_id: eventId,
    user_id: session.userId,
    sport_choices: payload.sportChoices ?? [],
    waiver_accepted: payload.waiverAccepted ?? false,
    phone_number: payload.phoneNumber || profile.phone_number || null,
  };

  if (isTeam) {
    baseInsert.team_name = payload.teamName?.trim();
    baseInsert.is_captain = true;
    baseInsert.team_members = teamMembers;
  }

  // Attempt insert with team fields; gracefully fallback if columns are still propagating
  let insertError = null;
  const { error } = await supabase.from("event_registrations").insert(baseInsert as any);

  if (error) {
    // If the DB does not yet have team_name/team_members columns, retry without them
    if (error.message?.includes("column") && error.message?.includes("does not exist")) {
      const fallbackInsert = {
        event_id: eventId,
        user_id: session.userId,
        sport_choices: payload.sportChoices ?? [],
        waiver_accepted: payload.waiverAccepted ?? false,
        phone_number: payload.phoneNumber || profile.phone_number || null,
      };
      const { error: retryErr } = await supabase.from("event_registrations").insert(fallbackInsert as any);
      insertError = retryErr;
    } else {
      insertError = error;
    }
  }

  if (insertError) {
    if (insertError.code === "23505") {
      return { success: false, error: "You are already registered for this event." };
    }
    return { success: false, error: insertError.message };
  }

  revalidatePath("/sports");
  revalidatePath("/dashboard/student/events");
  return { success: true, registered: true };
}

export interface SportTeamGroup {
  sport: string;
  isTeamSport: boolean;
  teams: Array<{
    id: number;
    teamName: string;
    captain: {
      name: string;
      email?: string;
      department?: string;
      course?: string;
      rollNumber?: string;
      phone?: string;
    };
    members: TeamMember[];
    registeredAt: string;
  }>;
  soloParticipants: Array<{
    id: number;
    name: string;
    department?: string;
    course?: string;
    rollNumber?: string;
    phone?: string;
    registeredAt: string;
  }>;
}

/**
 * Fetch all registrations for an event and group them per sport:
 * separating teams (with captain and full squad roster) and solo participants.
 */
export async function getEventTeamsBySport(
  eventId: number
): Promise<{ success: boolean; data?: SportTeamGroup[]; error?: string }> {
  try {
    const supabase = createSupabaseAdminClient();

    let registrationsData: any[] = [];
    const { data, error } = await supabase
      .from("event_registrations")
      .select(
        `id, registered_at, sport_choices, phone_number, waiver_accepted, team_name, is_captain, team_members,
         profiles:user_id (full_name, email, department, course, batch_year, roll_number)`
      )
      .eq("event_id", eventId)
      .order("registered_at", { ascending: true });

    if (error) {
      if (error.message?.includes("column") && error.message?.includes("does not exist")) {
        const { data: fallbackData, error: fbErr } = await supabase
          .from("event_registrations")
          .select(
            `id, registered_at, sport_choices, phone_number, waiver_accepted,
             profiles:user_id (full_name, email, department, course, batch_year, roll_number)`
          )
          .eq("event_id", eventId)
          .order("registered_at", { ascending: true });
        if (fbErr) return { success: false, error: fbErr.message };
        registrationsData = fallbackData || [];
      } else {
        return { success: false, error: error.message };
      }
    } else {
      registrationsData = data || [];
    }

    // Map each sport to its groups
    const sportsMap = new Map<string, SportTeamGroup>();

    // Initialize all known sports in order
    const allSports = [...SPORTS_LIST];
    for (const sport of allSports) {
      const isTeam = (TEAM_SPORTS as readonly string[]).includes(sport);
      sportsMap.set(sport, {
        sport,
        isTeamSport: isTeam,
        teams: [],
        soloParticipants: [],
      });
    }

    // Populate registrations into sports
    for (const reg of registrationsData) {
      const sports: string[] = Array.isArray(reg.sport_choices) ? reg.sport_choices : [];
      const profile = reg.profiles || {};

      for (const sport of sports) {
        if (!sportsMap.has(sport)) {
          const isTeam = (TEAM_SPORTS as readonly string[]).includes(sport);
          sportsMap.set(sport, {
            sport,
            isTeamSport: isTeam,
            teams: [],
            soloParticipants: [],
          });
        }

        const group = sportsMap.get(sport)!;

        if (reg.team_name) {
          // Team registration
          group.teams.push({
            id: reg.id,
            teamName: reg.team_name,
            captain: {
              name: profile.full_name || "Captain",
              email: profile.email,
              department: profile.department || profile.course,
              course: profile.course,
              rollNumber: profile.roll_number,
              phone: reg.phone_number,
            },
            members: Array.isArray(reg.team_members) ? reg.team_members : [],
            registeredAt: reg.registered_at,
          });
        } else {
          // Solo participant
          group.soloParticipants.push({
            id: reg.id,
            name: profile.full_name || "Participant",
            department: profile.department || profile.course,
            course: profile.course,
            rollNumber: profile.roll_number,
            phone: reg.phone_number,
            registeredAt: reg.registered_at,
          });
        }
      }
    }

    return { success: true, data: Array.from(sportsMap.values()) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Get registration details for the current user for a given event.
 */
export async function getCurrentUserRegistration(eventId: number) {
  const session = await getSession();
  if (!session) return { success: false, registration: null };

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("event_id", eventId)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  return { success: true, registration: data };
}

/**
 * Cancel an existing registration.
 */
export async function cancelEventRegistration(eventId: number) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Not authenticated." };
  }

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("event_registrations")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", session.userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/sports");
  revalidatePath("/dashboard/student/events");
  return { success: true, registered: false };
}

/**
 * Legacy toggle kept for backward compat with non-sports events.
 */
export async function toggleEventRegistration(eventId: number) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Please log in to register for events." };
  }

  const supabase = createSupabaseAdminClient();

  const { data: existing } = await supabase
    .from("event_registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("event_registrations")
      .delete()
      .eq("id", existing.id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/sports");
    revalidatePath("/dashboard/student/events");
    return { success: true, registered: false };
  } else {
    const { error } = await supabase.from("event_registrations").insert({
      event_id: eventId,
      user_id: session.userId,
    } as any);
    if (error) return { success: false, error: error.message };
    revalidatePath("/sports");
    revalidatePath("/dashboard/student/events");
    return { success: true, registered: true };
  }
}

