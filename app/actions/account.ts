"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { ALLOWED_PHOTO_TYPES, uploadPhoto } from "@/lib/supabase/photo-storage";

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

  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    return { error: "Only JPEG, PNG, WebP, or HEIC images are accepted." };
  }

  const result = await uploadPhoto("staff-photos", user.id, file);
  if ("error" in result) return result;

  await prisma.user.update({
    where: { id: user.id },
    data: { photoUrl: `${result.publicUrl}?t=${Date.now()}` },
  });

  revalidatePath("/account/profile");
  revalidatePath("/team");
  revalidatePath(`/team/${user.id}`);

  return {};
}
