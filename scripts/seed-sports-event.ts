/**
 * scripts/seed-sports-event.ts
 * 
 * Uploads the sports festival banner to MinIO and inserts the
 * SAAHS Sports Festival 2026 event into the database.
 * 
 * Run with:  npx tsx scripts/seed-sports-event.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as Minio from "minio";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../.env") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "187.77.188.200",
  port: parseInt(process.env.MINIO_PORT || "9000", 10),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin123",
});

const BUCKET_NAME = "saahs";
const PUBLIC_BASE = process.env.MINIO_PUBLIC_URL || "https://files.omnicassion.com";

// Path to the generated banner image — update if moved
const BANNER_PATH = path.join(
  "C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\05510071-b5c0-48a8-9b3a-ab813b14f64b",
  "sports_festival_banner_1790181890750.jpg"
);

async function ensureBucket() {
  const exists = await minioClient.bucketExists(BUCKET_NAME);
  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME, "us-east-1");
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
        },
      ],
    };
    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
  }
}

async function uploadBanner(): Promise<string> {
  await ensureBucket();

  if (!fs.existsSync(BANNER_PATH)) {
    throw new Error(`Banner not found at: ${BANNER_PATH}`);
  }

  const buffer = fs.readFileSync(BANNER_PATH);
  const objectName = `events/${Date.now()}-sports_festival_2026.jpg`;

  await minioClient.putObject(BUCKET_NAME, objectName, buffer, buffer.length, {
    "Content-Type": "image/jpeg",
  });

  const url = `${PUBLIC_BASE}/${BUCKET_NAME}/${objectName}`;
  console.log("✅ Banner uploaded:", url);
  return url;
}

async function seedEvent(bannerUrl: string) {
  // Check if event already exists
  const { data: existing } = await supabase
    .from("events")
    .select("id")
    .ilike("title", "%Sports Festival 2026%")
    .maybeSingle();

  if (existing) {
    console.log("⚠️  Sports Festival 2026 event already exists (id:", existing.id, "). Updating banner...");
    const { error } = await supabase
      .from("events")
      .update({ banner_url: bannerUrl })
      .eq("id", existing.id);
    if (error) throw new Error("Update failed: " + error.message);
    console.log("✅ Banner updated on existing event.");
    return;
  }

  const { data, error } = await supabase.from("events").insert({
    title: "SAAHS Sports Festival 2026",
    description:
      "🏆 Sports Event Registrations are Now Open!\n\n" +
      "We are thrilled to announce the SAAHS Sports Festival 2026! " +
      "Whether you are looking to shine in solo events or team up for group events, " +
      "this is your chance to showcase your skills and represent your batch.\n\n" +
      "Solo Events: Carrom, Chess, Arm Wrestling, Badminton, 100m Race, 400m Race, Shotput Throw, Javelin Throw\n\n" +
      "Team Events: BGMI, Football, Basketball, Kabaddi, Relay Race (4×100), Cricket, Badminton (Doubles), Tug of War, Volleyball\n\n" +
      "Please review the Terms & Conditions and Liability Waiver carefully before submitting your registration.\n\n" +
      "Gather your squads, get ready to compete, and let the games begin! 🎉",
    category: "Sports",
    banner_url: bannerUrl,
    schedule: new Date("2026-10-15T09:00:00+05:30").toISOString(),
    venue: "PGIMER Sports Ground, Chandigarh",
    organizer_info: "SAAHS Sports Committee",
    past_archive: false,
  } as any).select("id").single();

  if (error) throw new Error("Insert failed: " + error.message);
  console.log("✅ Sports Festival 2026 event created! ID:", data?.id);
}

async function main() {
  try {
    console.log("📤 Uploading banner to MinIO...");
    const bannerUrl = await uploadBanner();

    console.log("📝 Seeding event to database...");
    await seedEvent(bannerUrl);

    console.log("\n🎉 Done! The SAAHS Sports Festival 2026 event is now live.");
  } catch (err: any) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

main();
