/**
 * lib/vibe-mehfil-constants.ts
 * Shared constants for Kaleidoscope — Vibe-e-Mehfil (SAAHS Indoor Cultural Events 2026).
 * Schedule sourced from the official Kaleidoscope committee timetable.
 */

export interface EventSession {
  /** ISO date, e.g. "2026-10-05" */
  date: string;
  /** Display label, e.g. "2:00 PM – 4:00 PM" */
  time: string;
}

export const SOLO_EVENTS = [
  "Rangoli",
  "Stand-up",
  "Mimicry",
  "Poem Recitation",
  "Art & Craft",
  "Mehndi",
  "T-Shirt Painting",
  "Nail Art",
  "Storytelling",
  "Face Painting",
  "Meme Challenge (Online)",
  "Reel Making (Online)",
] as const;

export const TEAM_EVENTS = [
  "Debate",
  "Mystery Murder",
  "Master Chef",
  "Blind Art",
  "Skit / Nukkad Natak",
] as const;

export type SoloEvent = (typeof SOLO_EVENTS)[number];
export type TeamEvent = (typeof TEAM_EVENTS)[number];
export type MehfilEventName = SoloEvent | TeamEvent;

export const ALL_MEHFIL_EVENTS = [...SOLO_EVENTS, ...TEAM_EVENTS] as const;

export const TEAM_EVENTS_CONFIG: Record<
  TeamEvent,
  { minPlayers: number; maxPlayers: number; description: string }
> = {
  Debate: {
    minPlayers: 2,
    maxPlayers: 2,
    description: "Teams of 2 — for and against a given motion.",
  },
  "Mystery Murder": {
    minPlayers: 4,
    maxPlayers: 8,
    description: "Live murder-mystery role-play — squads of 4 to 8.",
  },
  "Master Chef": {
    minPlayers: 2,
    maxPlayers: 2,
    description: "Cooking duo — plate up a dish together against the clock.",
  },
  "Blind Art": {
    minPlayers: 2,
    maxPlayers: 2,
    description: "One blindfolded artist + one guide describing the picture.",
  },
  "Skit / Nukkad Natak": {
    minPlayers: 4,
    maxPlayers: 10,
    description: "Street-play / skit troupe — 4 to 10 performers.",
  },
};

/** Schedule per event. Multi-session events (e.g. multi-round Art & Craft) list every session. */
export const EVENT_SCHEDULE: Record<MehfilEventName, EventSession[]> = {
  Rangoli: [{ date: "2026-10-05", time: "2:00 PM – 4:00 PM" }],
  Debate: [{ date: "2026-10-06", time: "2:00 PM – 4:00 PM" }],
  "Mystery Murder": [{ date: "2026-10-07", time: "2:00 PM – 4:00 PM" }],
  "Stand-up": [{ date: "2026-10-08", time: "2:00 PM – 4:00 PM" }],
  Mimicry: [{ date: "2026-10-09", time: "2:00 PM – 4:00 PM" }],
  "Master Chef": [{ date: "2026-10-10", time: "2:00 PM – 4:00 PM" }],
  "Poem Recitation": [{ date: "2026-10-12", time: "2:00 PM – 4:00 PM" }],
  "Blind Art": [{ date: "2026-10-13", time: "2:00 PM – 4:00 PM" }],
  "Skit / Nukkad Natak": [{ date: "2026-10-14", time: "2:00 PM – 4:00 PM" }],
  "Art & Craft": [
    { date: "2026-10-15", time: "2:00 PM – 4:00 PM (Round 1)" },
    { date: "2026-10-16", time: "2:00 PM – 4:00 PM (Round 2)" },
    { date: "2026-10-19", time: "2:00 PM – 4:00 PM (Round 3)" },
  ],
  Mehndi: [{ date: "2026-10-15", time: "5:00 PM – 6:00 PM" }],
  "T-Shirt Painting": [{ date: "2026-10-16", time: "5:00 PM – 6:00 PM" }],
  "Nail Art": [{ date: "2026-10-17", time: "5:00 PM – 6:00 PM" }],
  Storytelling: [{ date: "2026-10-17", time: "2:00 PM – 4:00 PM" }],
  "Face Painting": [{ date: "2026-10-19", time: "5:00 PM – 6:00 PM" }],
  "Meme Challenge (Online)": [{ date: "2026-10-05", time: "Rolling — submit anytime during the fest" }],
  "Reel Making (Online)": [{ date: "2026-10-05", time: "Rolling — submit anytime during the fest" }],
};

// ─────────────────────────────────────────────────────────────────────────────
// Splitting a stored `event_registrations` row back into one entry per event.
// A single row holds every event a student picked together — `sport_choices`
// (reused generically here) lists every event name, and `team_members` is one
// flat array for every team the student captained, tagged `_sport`/`_team_name`.
// ─────────────────────────────────────────────────────────────────────────────

export interface MehfilRegistrationMember {
  name: string;
  roll_number?: string;
  department?: string;
  phone?: string;
  is_captain?: boolean;
  is_portal_registered?: boolean;
  profile_id?: string;
  _sport?: string;
  _team_name?: string;
}

export interface MehfilSplitTeamEntry {
  event: string;
  teamName: string;
  members: MehfilRegistrationMember[];
}

export interface MehfilSplitRegistration {
  soloEvents: string[];
  teamEntries: MehfilSplitTeamEntry[];
}

export function splitRegistrationByEvent(reg: {
  sport_choices?: string[] | null;
  team_name?: string | null;
  team_members?: MehfilRegistrationMember[] | null;
}): MehfilSplitRegistration {
  const events = Array.isArray(reg.sport_choices) ? reg.sport_choices : [];
  const allMembers = Array.isArray(reg.team_members) ? reg.team_members : [];

  const soloEvents: string[] = [];
  const teamEntries: MehfilSplitTeamEntry[] = [];

  for (const ev of events) {
    const isTeamEvent = (TEAM_EVENTS as readonly string[]).includes(ev);
    if (!isTeamEvent) {
      soloEvents.push(ev);
      continue;
    }

    const tagged = allMembers.filter((m) => m._sport === ev);
    const members = tagged.length > 0 ? tagged : allMembers;
    const taggedName = tagged.find((m) => m._team_name)?._team_name;

    let teamName = taggedName || reg.team_name || "Team";
    if (!taggedName && reg.team_name) {
      const part = reg.team_name.split(" | ").find((p) => p.trim().startsWith(`${ev}:`));
      if (part) teamName = part.slice(part.indexOf(":") + 1).trim();
    }

    teamEntries.push({ event: ev, teamName, members });
  }

  return { soloEvents, teamEntries };
}
