"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

export type ProfileFormState = { error?: string; success?: string } | undefined;

export async function updateMyProfile(
  _state: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const user = await requireAuth();

  const bio = (formData.get("bio") as string)?.trim() || null;
  const isPublished = formData.get("isPublished") === "on";

  await prisma.user.update({
    where: { id: user.id },
    data: { bio, isPublished },
  });

  revalidatePath("/account/profile");
  revalidatePath("/team");
  revalidatePath(`/team/${user.id}`);

  return { success: "Profile updated." };
}

export async function uploadStaffPhoto(formData: FormData): Promise<{ error?: string }> {
  const user = await requireAuth();

  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return { error: "No file selected." };

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
  if (!allowed.includes(file.type)) return { error: "Only JPEG, PNG, WebP, or HEIC images are accepted." };

  const ext  = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}.${ext}`;

  const supabase = createAdminClient();
  const { error: uploadError } = await supabase.storage
    .from("staff-photos")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: `Upload failed: ${uploadError.message}` };

  const { data: { publicUrl } } = supabase.storage
    .from("staff-photos")
    .getPublicUrl(path);

  await prisma.user.update({
    where: { id: user.id },
    data: { photoUrl: `${publicUrl}?t=${Date.now()}` },
  });

  revalidatePath("/account/profile");
  revalidatePath("/team");
  revalidatePath(`/team/${user.id}`);

  return {};
}
