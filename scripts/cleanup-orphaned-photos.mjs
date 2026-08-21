/**
 * One-time maintenance script: removes orphaned photo files left behind by
 * the old upload path, where switching image formats (e.g. .png -> .jpg)
 * created a second file at a different storage key without removing the
 * first one. New uploads no longer do this (see lib/supabase/photo-storage.ts),
 * but files from before that fix can still be sitting in storage.
 *
 * A file is only considered orphaned if it is NOT the file a current
 * `photoUrl` in the database actually points to — the active photo for
 * every participant/staff member is never touched.
 *
 * Dry-run by default (lists what would be deleted). Pass --apply to delete.
 * Run with: node scripts/cleanup-orphaned-photos.mjs [--apply]
 * Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and DATABASE_URL in .env.local
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

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
for (const [key, value] of Object.entries(env)) {
  if (!process.env[key]) process.env[key] = value;
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const apply = process.argv.includes("--apply");

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const prisma = new PrismaClient();

function basename(photoUrl) {
  if (!photoUrl) return null;
  return photoUrl.split("?")[0].split("/").pop() ?? null;
}

async function listAll(bucket) {
  const all = [];
  let offset = 0;
  const limit = 1000;
  for (;;) {
    const { data, error } = await supabase.storage.from(bucket).list("", { limit, offset });
    if (error) throw new Error(`Failed to list ${bucket}: ${error.message}`);
    all.push(...data);
    if (data.length < limit) break;
    offset += limit;
  }
  return all;
}

async function cleanupBucket(bucket, records) {
  const activeFilenames = new Set();
  for (const r of records) {
    const name = basename(r.photoUrl);
    if (name) activeFilenames.add(name);
  }
  const idsWithRecord = new Set(records.map((r) => r.id));

  const files = await listAll(bucket);
  const stale = [];
  for (const file of files) {
    if (activeFilenames.has(file.name)) continue; // this is the current active photo — keep

    const dot = file.name.lastIndexOf(".");
    const id = dot === -1 ? file.name : file.name.slice(0, dot);
    const reason = idsWithRecord.has(id)
      ? "superseded by a different-extension upload"
      : "no matching record (deleted?)";
    stale.push({ name: file.name, reason });
  }

  console.log(`\n${bucket}: ${files.length} file(s), ${stale.length} orphaned`);
  for (const s of stale) console.log(`  - ${s.name}  (${s.reason})`);

  if (apply && stale.length > 0) {
    const { error } = await supabase.storage.from(bucket).remove(stale.map((s) => s.name));
    if (error) throw new Error(`Failed to delete from ${bucket}: ${error.message}`);
    console.log(`  Deleted ${stale.length} file(s).`);
  }

  return stale.length;
}

const [participants, users] = await Promise.all([
  prisma.participant.findMany({ select: { id: true, photoUrl: true } }),
  prisma.user.findMany({ select: { id: true, photoUrl: true } }),
]);

const participantOrphans = await cleanupBucket("participant-photos", participants);
const staffOrphans = await cleanupBucket("staff-photos", users);

await prisma.$disconnect();

if (!apply && participantOrphans + staffOrphans > 0) {
  console.log("\nDry run only — re-run with --apply to delete the files listed above.");
} else if (participantOrphans + staffOrphans === 0) {
  console.log("\nNo orphaned photo files found.");
}
