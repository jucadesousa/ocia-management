import { createAdminClient } from "@/lib/supabase/admin";

export const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

/**
 * Uploads a photo to `{id}.jpg` in the given bucket (path is always
 * normalized to .jpg, regardless of the source file's extension, so an
 * id maps to a single deterministic storage key across re-uploads).
 * The correct Content-Type is still set from the actual file, so the
 * image renders fine even though a PNG/WebP source ends up at a ".jpg" URL.
 *
 * After a successful upload, any other file left over under this id
 * (e.g. from before this normalization, or a still-orphaned prior format)
 * is removed on a best-effort basis — cleanup never fails the upload.
 */
export async function uploadPhoto(
  bucket: string,
  id: string,
  file: File
): Promise<{ publicUrl: string } | { error: string }> {
  const path = `${id}.jpg`;
  const supabase = createAdminClient();

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: `Upload failed: ${uploadError.message}` };

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  try {
    const { data: entries } = await supabase.storage.from(bucket).list("", { search: id });
    const stale = (entries ?? [])
      .filter((entry) => entry.name.startsWith(`${id}.`) && entry.name !== path)
      .map((entry) => entry.name);
    if (stale.length > 0) await supabase.storage.from(bucket).remove(stale);
  } catch {
    // Best-effort cleanup — the new photo is already live either way.
  }

  return { publicUrl };
}
