/**
 * lib/sports-constants.ts
 * Shared constants for the SAAHS Sports Festival registration.
 * Can be safely imported by both server and client components.
 */

export const SPORTS_LIST = [
  "Football",
  "Basketball",
  "Kabaddi",
  "Volleyball",
  "BGMI",
  "Tug of War",
  "Athletics (Track & Field)",
  "Badminton",
  "Table Tennis",
  "Chess",
  "Carrom",
] as const;

export type SportName = (typeof SPORTS_LIST)[number];
