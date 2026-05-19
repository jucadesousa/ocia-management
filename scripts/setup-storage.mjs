/**
 * One-time script: creates the participant-photos Supabase Storage bucket.
 * Run with: node scripts/setup-storage.mjs
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// Parse .env.local manually (no dotenv dependency needed)
const env = {};
try {
  const raw = readFileSync(".env.local", "utf8");
  for (const line of raw.split("\n")) {
    const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
  }
} catch {
  console.error("Could not read .env.local — make sure you run this from the project root.");
  process.exit(1);
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = "participant-photos";

const { data: existing } = await supabase.storage.getBucket(BUCKET);
if (existing) {
  console.log(`Bucket '${BUCKET}' already exists — nothing to do.`);
  process.exit(0);
}

const { error } = await supabase.storage.createBucket(BUCKET, {
  public: true,
  fileSizeLimit: 5 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
});

if (error) {
  console.error("Failed to create bucket:", error.message);
  process.exit(1);
}

console.log(`Bucket '${BUCKET}' created (public, 5 MB limit, JPEG/PNG/WebP).`);
console.log("Done. Photo uploads will now work in the app.");
