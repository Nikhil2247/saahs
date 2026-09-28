"use server";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import {
  ALL_MEHFIL_EVENTS,
  TEAM_EVENTS,
  splitRegistrationByEvent,
  type MehfilRegistrationMember,
} from "@/lib/vibe-mehfil-constants";

export interface MehfilEventGroup {
  event: string;
  isTeamEvent: boolean;
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
    members: MehfilRegistrationMember[];
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
 * Fetch all registrations for the Vibe-e-Mehfil event and group them per
 * sub-event: separating teams (with captain + roster) and solo participants.
 */
export async function getMehfilGroupsByEvent(
  eventId: number
): Promise<{ success: boolean; data?: MehfilEventGroup[]; error?: string }> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("event_registrations")
      .select(
        `id, registered_at, sport_choices, phone_number, waiver_accepted, team_name, is_captain, team_members,
         profiles:user_id (full_name, email, department, course, batch_year, roll_number)`
      )
      .eq("event_id", eventId)
      .order("registered_at", { ascending: true });

    if (error) return { success: false, error: error.message };

    const groupsMap = new Map<string, MehfilEventGroup>();

    const ensureGroup = (name: string) => {
      if (!groupsMap.has(name)) {
        groupsMap.set(name, {
          event: name,
          isTeamEvent: (TEAM_EVENTS as readonly string[]).includes(name),
          teams: [],
          soloParticipants: [],
        });
      }
      return groupsMap.get(name)!;
    };

    for (const name of ALL_MEHFIL_EVENTS) ensureGroup(name);

    for (const reg of data || []) {
      const profile = (reg as any).profiles || {};
      const { soloEvents, teamEntries } = splitRegistrationByEvent(reg as any);

      for (const ev of soloEvents) {
        ensureGroup(ev).soloParticipants.push({
          id: reg.id,
          name: profile.full_name || "Participant",
          department: profile.department || profile.course,
          course: profile.course,
          rollNumber: profile.roll_number,
          phone: (reg as any).phone_number,
          registeredAt: (reg as any).registered_at,
        });
      }

      for (const entry of teamEntries) {
        const captainMember = entry.members.find((m) => m.is_captain);
        ensureGroup(entry.event).teams.push({
          id: reg.id,
          teamName: entry.teamName,
          captain: {
            name: captainMember?.name || profile.full_name || "Captain",
            email: profile.email,
            department: captainMember?.department || profile.department || profile.course,
            course: profile.course,
            rollNumber: captainMember?.roll_number || profile.roll_number,
            phone: captainMember?.phone || (reg as any).phone_number,
          },
          members: entry.members,
          registeredAt: (reg as any).registered_at,
        });
      }
    }

    return { success: true, data: Array.from(groupsMap.values()) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
