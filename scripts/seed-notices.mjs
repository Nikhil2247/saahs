/**
 * scripts/seed-notices.mjs
 *
 * One-off seed script — inserts the AGM and Teachers' Day notices into
 * the production `notices` table via the Supabase service role key.
 *
 * This does NOT run automatically. Review it, then run it yourself:
 *
 *   node scripts/seed-notices.mjs --by-email=your-admin-login@example.com
 *
 * `--by-email` must be the email of an existing, onboarded profile in
 * `public.profiles` (notices.created_by is a required FK to a profile).
 * If you don't pass it, the script looks for the highest-ranking
 * office bearer profile it can find (President > Vice President > ...).
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
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env"
  );
  process.exit(1);
}

const byEmailArg = process.argv
  .find((a) => a.startsWith("--by-email="))
  ?.split("=")[1];

const ROLE_PRIORITY = [
  "President",
  "Vice President",
  "General Secretary",
  "Treasurer",
  "Governing Body Member",
  "Executive Body Member",
];

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function resolveCreatedBy() {
  if (byEmailArg) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("email", byEmailArg)
      .single();
    if (error || !data) {
      throw new Error(
        `No profile found for --by-email="${byEmailArg}" (${error?.message ?? "not found"})`
      );
    }
    return data;
  }

  for (const role of ROLE_PRIORITY) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("role", role)
      .limit(1)
      .maybeSingle();
    if (data) return data;
  }

  throw new Error(
    "Could not auto-detect an admin profile. Re-run with --by-email=<an existing onboarded profile's email>."
  );
}

const NOTICES = [
  {
    title: "Annual General Body Meeting 2026",
    content:
      "All members are requested to attend the Annual General Body Meeting scheduled for next Friday at 4:00 PM in the main auditorium. Agenda items include budget review and executive committee elections.",
    category: "General",
    is_pinned: true,
    created_at: "2026-07-07T10:00:00+05:30",
  },
  {
    title: "Teachers' Day Celebration",
    content:
      "SAAHS will celebrate Teachers' Day on 5th September 2026 at the NIAHS Auditorium, PGIMER Chandigarh, to honour our faculty, clinicians and mentors across all allied health departments. All members are invited to attend.",
    category: "Event",
    is_pinned: true,
    // created_at omitted — defaults to NOW() so it surfaces as freshly published
  },
];

async function main() {
  const createdBy = await resolveCreatedBy();
  console.log(
    `Using created_by = ${createdBy.full_name ?? createdBy.email} (${createdBy.role}) — ${createdBy.id}`
  );

  for (const notice of NOTICES) {
    const { error } = await supabase.from("notices").insert({
      ...notice,
      created_by: createdBy.id,
    });
    if (error) {
      console.error(`Failed to insert "${notice.title}":`, error.message);
    } else {
      console.log(`Inserted: ${notice.title}`);
    }
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
