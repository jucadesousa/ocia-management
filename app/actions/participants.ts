"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { BaptismType, Group, OciaStage, ParticipantStatus } from "@prisma/client";

function deriveBaptismType(isBaptized: boolean | null, denomination: string | null): BaptismType {
  if (!isBaptized) return "NONE";
  if (denomination && /catholic/i.test(denomination)) return "CATHOLIC";
  return "OTHER_UNVERIFIED";
}

export type ParticipantFormState = { error?: string; success?: boolean } | undefined;

function str(formData: FormData, key: string): string | null {
  const val = (formData.get(key) as string)?.trim();
  return val || null;
}

export async function createParticipant(
  _state: ParticipantFormState,
  formData: FormData
): Promise<ParticipantFormState> {
  await requireAuth();

  const firstName = str(formData, "firstName");
  const lastName = str(formData, "lastName");
  const group = str(formData, "group") as Group | null;

  if (!firstName || !lastName || !group) {
    return { error: "First name, last name, and group are required." };
  }

  const cycle = await prisma.cycle.findFirst({ where: { isCurrent: true } });
  if (!cycle) return { error: "No active cycle found. Contact an administrator." };

  const dobRaw = str(formData, "dateOfBirth");
  const interviewRaw = str(formData, "interviewDate");

  const participant = await prisma.participant.create({
    data: {
      firstName,
      lastName,
      maidenName: str(formData, "maidenName"),
      fullName: str(formData, "fullName") || `${firstName} ${lastName}`,
      preferredName: str(formData, "preferredName"),
      dateOfBirth: dobRaw ? new Date(dobRaw) : null,
      placeOfBirth: str(formData, "placeOfBirth"),
      group,
      cycleId: cycle.id,
      phone: str(formData, "phone"),
      phoneWork: str(formData, "phoneWork"),
      email: str(formData, "email"),
      address: str(formData, "address"),
      city: str(formData, "city"),
      state: str(formData, "state"),
      zipCode: str(formData, "zipCode"),
      spouseName: str(formData, "spouseName"),
      occupation: str(formData, "occupation"),
      currentReligion: str(formData, "currentReligion"),
      maritalStatus: str(formData, "maritalStatus"),
      status: (str(formData, "status") as ParticipantStatus) || "ACTIVE",
      ociaStage: (str(formData, "ociaStage") as OciaStage) || "INQUIRY",
      sponsorName: str(formData, "sponsorName"),
      interviewDate: interviewRaw ? new Date(interviewRaw) : null,
      notes: str(formData, "notes"),
    },
  });

  redirect(`/participants/${participant.id}`);
}

export async function updateParticipant(
  id: string,
  _state: ParticipantFormState,
  formData: FormData
): Promise<ParticipantFormState> {
  await requireAuth();

  const firstName = str(formData, "firstName");
  const lastName = str(formData, "lastName");
  const group = str(formData, "group") as Group | null;

  if (!firstName || !lastName || !group) {
    return { error: "First name, last name, and group are required." };
  }

  const dobRaw = str(formData, "dateOfBirth");
  const interviewRaw = str(formData, "interviewDate");

  await prisma.participant.update({
    where: { id },
    data: {
      firstName,
      lastName,
      maidenName: str(formData, "maidenName"),
      fullName: str(formData, "fullName") || `${firstName} ${lastName}`,
      preferredName: str(formData, "preferredName"),
      dateOfBirth: dobRaw ? new Date(dobRaw) : null,
      placeOfBirth: str(formData, "placeOfBirth"),
      group,
      phone: str(formData, "phone"),
      phoneWork: str(formData, "phoneWork"),
      email: str(formData, "email"),
      address: str(formData, "address"),
      city: str(formData, "city"),
      state: str(formData, "state"),
      zipCode: str(formData, "zipCode"),
      spouseName: str(formData, "spouseName"),
      occupation: str(formData, "occupation"),
      currentReligion: str(formData, "currentReligion"),
      maritalStatus: str(formData, "maritalStatus"),
      status: (str(formData, "status") as ParticipantStatus) || "ACTIVE",
      ociaStage: (str(formData, "ociaStage") as OciaStage) || "INQUIRY",
      sponsorName: str(formData, "sponsorName"),
      interviewDate: interviewRaw ? new Date(interviewRaw) : null,
      notes: str(formData, "notes"),
    },
  });

  revalidatePath(`/participants/${id}`);
  revalidatePath("/participants");
  redirect(`/participants/${id}`);
}

export async function deleteParticipant(id: string): Promise<void> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") return;

  await prisma.attendanceRecord.deleteMany({ where: { participantId: id } });
  await prisma.participant.delete({ where: { id } });

  revalidatePath("/participants");
  redirect("/participants");
}

function yesNo(formData: FormData, key: string): boolean | null {
  const val = formData.get(key) as string;
  if (val === "yes") return true;
  if (val === "no") return false;
  return null;
}

export async function registerParticipant(
  _state: ParticipantFormState,
  formData: FormData
): Promise<ParticipantFormState> {
  const firstName = str(formData, "firstName");
  const lastName = str(formData, "lastName");
  const group = str(formData, "group") as Group | null;

  if (!firstName || !lastName || !group) {
    return { error: "First name, last name, and language group are required." };
  }

  const cycle = await prisma.cycle.findFirst({ where: { isCurrent: true } });
  if (!cycle) {
    return { error: "Registration is currently unavailable. Please contact the parish office." };
  }

  const dobRaw = str(formData, "dateOfBirth");
  const maritalStatus = str(formData, "maritalStatus");

  const participant = await prisma.participant.create({
    data: {
      firstName,
      lastName,
      maidenName: str(formData, "maidenName"),
      fullName: `${firstName} ${lastName}`,
      preferredName: str(formData, "preferredName"),
      dateOfBirth: dobRaw ? new Date(dobRaw) : null,
      placeOfBirth: str(formData, "placeOfBirth"),
      group,
      cycleId: cycle.id,
      phone: str(formData, "phone"),
      phoneWork: str(formData, "phoneWork"),
      email: str(formData, "email"),
      address: str(formData, "address"),
      city: str(formData, "city"),
      state: str(formData, "state"),
      zipCode: str(formData, "zipCode"),
      spouseName: str(formData, "spouseName"),
      occupation: str(formData, "occupation"),
      currentReligion: str(formData, "currentReligion"),
      maritalStatus,
      sponsorName: str(formData, "sponsorName"),
      notes: str(formData, "additionalComments"),
      status: "ACTIVE",
      ociaStage: "INQUIRY",
    },
  });

  // Collect sacramental / background fields submitted on the public form
  const isBaptized = yesNo(formData, "isBaptized");
  const baptismDenomination = str(formData, "baptismDenomination");
  const baptismType = deriveBaptismType(isBaptized, baptismDenomination);
  const marriedToCatholic = yesNo(formData, "marriedToCatholic");
  const marriedByCatholicPriest = yesNo(formData, "marriedByCatholicPriest");
  const hadPriorMarriage = yesNo(formData, "hadPriorMarriage");
  const spouseHadPriorMarriage = yesNo(formData, "spouseHadPriorMarriage");
  const hasChildren = yesNo(formData, "hasChildren");
  const childrenNotes = str(formData, "childrenNotes");

  const hasSacramentalData =
    isBaptized !== null ||
    baptismDenomination ||
    marriedToCatholic !== null ||
    marriedByCatholicPriest !== null ||
    hadPriorMarriage !== null ||
    spouseHadPriorMarriage !== null ||
    hasChildren !== null ||
    childrenNotes;

  if (hasSacramentalData) {
    await prisma.sacramentalRecord.create({
      data: {
        participantId: participant.id,
        isBaptized,
        baptismType,
        baptismDenomination,
        marriageStatus: maritalStatus,
        marriedToCatholic,
        marriedByCatholicPriest,
        hadPriorMarriage,
        spouseHadPriorMarriage,
        hasChildren,
        childrenNotes,
      },
    });
  }

  // Optional photo — failure is silent so it never blocks registration
  const photoFile = formData.get("photo") as File | null;
  if (photoFile && photoFile.size > 0) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    if (allowed.includes(photoFile.type)) {
      try {
        const ext = photoFile.name.split(".").pop() ?? "jpg";
        const path = `${participant.id}.${ext}`;
        const supabase = createAdminClient();
        const { error: uploadError } = await supabase.storage
          .from("participant-photos")
          .upload(path, photoFile, { upsert: true, contentType: photoFile.type });
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("participant-photos")
            .getPublicUrl(path);
          await prisma.participant.update({
            where: { id: participant.id },
            data: { photoUrl: `${publicUrl}?t=${Date.now()}` },
          });
        }
      } catch {
        // Photo upload failed — participant record is already saved, continue
      }
    }
  }

  return { success: true };
}

export async function toggleBadgePrinted(formData: FormData): Promise<void> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") return;
  const id = formData.get("participantId") as string;
  const printed = formData.get("printed") === "true";
  await prisma.participant.update({ where: { id }, data: { badgePrinted: printed } });
  revalidatePath("/participants/badges");
}

export async function markAllBadgesPrinted(formData: FormData): Promise<void> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") return;
  const ids = (formData.get("participantIds") as string).split(",").filter(Boolean);
  await prisma.participant.updateMany({ where: { id: { in: ids } }, data: { badgePrinted: true } });
  revalidatePath("/participants/badges");
  redirect("/participants/badges");
}
