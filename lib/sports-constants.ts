/**
 * lib/sports-constants.ts
 * Shared constants for the SAAHS Sports Festival registration.
 * Matches the official Google Form exactly.
 */

export const SOLO_SPORTS = [
  "Carrom",
  "Chess",
  "Arm wrestling (weight category based)",
  "Badminton",
  "Table Tennis",
  "100 mtr race",
  "400 mtr race",
  "Shotput Throw",
  "Javelin Throw",
] as const;

export const TEAM_SPORTS = [
  "BGMI (4-Player Squad)",
  "Football",
  "Basketball",
  "Kabaddi",
  "Relay race (4x100m)",
  "Cricket",
  "Badminton (Doubles)",
  "Table Tennis (Doubles)",
  "Volleyball",
  "Tug of war",
] as const;

export const TEAM_SPORTS_CONFIG: Record<
  TeamSport,
  {
    minPlayers: number;
    maxPlayers: number;
    activePlayers: number;
    substitutesAllowed: number;
    description: string;
  }
> = {
  "BGMI (4-Player Squad)": {
    activePlayers: 4,
    substitutesAllowed: 0,
    minPlayers: 4,
    maxPlayers: 4,
    description: "4-Player Squad (4 active on-field, 0 substitutes).",
  },
  Football: {
    activePlayers: 7,
    substitutesAllowed: 2,
    minPlayers: 7,
    maxPlayers: 9,
    description: "7 active players on-field + up to 2 substitutes (Total max 9).",
  },
  Basketball: {
    activePlayers: 5,
    substitutesAllowed: 2,
    minPlayers: 5,
    maxPlayers: 7,
    description: "5 active players on-court + up to 2 substitutes (Total max 7).",
  },
  Kabaddi: {
    activePlayers: 7,
    substitutesAllowed: 2,
    minPlayers: 7,
    maxPlayers: 9,
    description: "7 active players on-mat + up to 2 substitutes (Total max 9).",
  },
  "Relay race (4x100m)": {
    activePlayers: 4,
    substitutesAllowed: 0,
    minPlayers: 4,
    maxPlayers: 4,
    description: "4 runners (4 active, 0 substitutes).",
  },
  Cricket: {
    activePlayers: 7,
    substitutesAllowed: 2,
    minPlayers: 7,
    maxPlayers: 9,
    description: "7 active players on-pitch + up to 2 substitutes (Total max 9).",
  },
  "Badminton (Doubles)": {
    activePlayers: 2,
    substitutesAllowed: 0,
    minPlayers: 2,
    maxPlayers: 2,
    description: "2 players (captain + partner, 0 substitutes).",
  },
  "Table Tennis (Doubles)": {
    activePlayers: 2,
    substitutesAllowed: 0,
    minPlayers: 2,
    maxPlayers: 2,
    description: "2 players (captain + partner, 0 substitutes).",
  },
  Volleyball: {
    activePlayers: 6,
    substitutesAllowed: 1,
    minPlayers: 6,
    maxPlayers: 7,
    description: "6 active players on-court + 1 substitute (Total max 7).",
  },
  "Tug of war": {
    activePlayers: 8,
    substitutesAllowed: 2,
    minPlayers: 8,
    maxPlayers: 10,
    description: "8 active pullers + up to 2 substitutes (Total max 10).",
  },
};

/** All sports combined (for backward compat) */
export const SPORTS_LIST = [...SOLO_SPORTS, ...TEAM_SPORTS] as const;

export type SoloSport = (typeof SOLO_SPORTS)[number];
export type TeamSport = (typeof TEAM_SPORTS)[number];
export type SportName = SoloSport | TeamSport;

