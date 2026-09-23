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
  "100 mtr race",
  "400 mtr race",
  "Shotput Throw",
  "Javelin Throw",
] as const;

export const TEAM_SPORTS = [
  "BGMI",
  "Football",
  "Basketball",
  "Kabaddi",
  "Relay race (4x100)",
  "Cricket",
  "Badminton (doubles)",
  "Tug of war",
  "Volleyball",
] as const;

/** All sports combined (for backward compat) */
export const SPORTS_LIST = [...SOLO_SPORTS, ...TEAM_SPORTS] as const;

export type SoloSport = (typeof SOLO_SPORTS)[number];
export type TeamSport = (typeof TEAM_SPORTS)[number];
export type SportName = SoloSport | TeamSport;
