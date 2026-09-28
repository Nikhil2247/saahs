/**
 * scripts/seed-vibe-mehfil-event.mjs
 *
 * Inserts (or updates) the "Kaleidoscope presents Vibe-e-Mehfil 2026" event
 * into the `events` table so the /vibe-e-mehfil registration page has a real
 * event row to register against (event_registrations.event_id is a FK).
 *
 * Run with:  node scripts/seed-vibe-mehfil-event.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = join(__dirname, "..", ".env");
  const raw = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = { ...loadEnv(), ...process.env };

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EVENT = {
  title: "Kaleidoscope presents Vibe-e-Mehfil 2026",
  description:
    "✨ Kaleidoscope — The Cultural Club by SAAHS brings you Vibe-e-Mehfil, a series of indoor cultural events where creativity meets competition and every talent gets its moment to shine!\n\n" +
    "Solo Events: Rangoli, Stand-up, Mimicry, Poem Recitation, Art & Craft, Mehndi, T-Shirt Painting, Nail Art, Storytelling, Face Painting\n\n" +
    "Team Events: Debate, Mystery Murder, Master Chef, Blind Art, Skit / Nukkad Natak\n\n" +
    "Online: Meme Challenge, Reel Making\n\n" +
    "Starting 5th October — different talents, one stage. Create • Express • Celebrate.",
  category: "Cultural",
  banner_url: "/vibe-e-mehfil-banner.jpg",
  schedule: new Date("2026-10-05T14:00:00+05:30").toISOString(),
  venue: "SAAHS Campus, PGIMER (Indoor)",
  organizer_info: "Kaleidoscope — The Cultural Club by SAAHS",
  past_archive: false,
};

async function main() {
  const { data: existing } = await supabase
    .from("events")
    .select("id")
    .ilike("title", "%Vibe-e-Mehfil%")
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("events").update(EVENT).eq("id", existing.id);
    if (error) throw new Error("Update failed: " + error.message);
    console.log(`Updated existing Vibe-e-Mehfil event (id: ${existing.id}).`);
    return;
  }

  const { data, error } = await supabase.from("events").insert(EVENT).select("id").single();
  if (error) throw new Error("Insert failed: " + error.message);
  console.log(`Created Vibe-e-Mehfil event (id: ${data.id}).`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
