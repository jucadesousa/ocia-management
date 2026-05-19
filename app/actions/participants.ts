"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Group, OciaStage, ParticipantStatus } from "@prisma/client";

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

  return { success: true };
}
