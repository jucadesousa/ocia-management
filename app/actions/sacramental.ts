"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

export type SacramentalFormState = { error?: string } | undefined;

function str(formData: FormData, key: string): string | null {
  const val = (formData.get(key) as string)?.trim();
  return val || null;
}

function bool(formData: FormData, key: string): boolean | null {
  const val = formData.get(key) as string;
  if (val === "true")  return true;
  if (val === "false") return false;
  return null;
}

function boolDefault(formData: FormData, key: string, def: boolean): boolean {
  const val = formData.get(key) as string;
  if (val === "true")  return true;
  if (val === "false") return false;
  return def;
}

const BAPTISM_PROOF_VALUES = ["NONE", "CERTIFICATE", "LETTER", "OTHER"] as const;
type BaptismProofStatus = (typeof BAPTISM_PROOF_VALUES)[number];

function baptismProof(formData: FormData): BaptismProofStatus {
  const val = (formData.get("baptismProofStatus") as string)?.toUpperCase();
  return (BAPTISM_PROOF_VALUES as readonly string[]).includes(val)
    ? (val as BaptismProofStatus)
    : "NONE";
}

const BAPTISM_TYPE_VALUES = ["NONE", "CATHOLIC", "OTHER_VALID", "OTHER_UNVERIFIED"] as const;
type BaptismType = (typeof BAPTISM_TYPE_VALUES)[number];

function baptismType(formData: FormData): BaptismType {
  const val = (formData.get("baptismType") as string)?.toUpperCase();
  return (BAPTISM_TYPE_VALUES as readonly string[]).includes(val)
    ? (val as BaptismType)
    : "NONE";
}

export async function upsertSacramentalRecord(
  participantId: string,
  _state: SacramentalFormState,
  formData: FormData
): Promise<SacramentalFormState> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") return { error: "Admin access required." };

  const baptismDateRaw       = str(formData, "baptismDate");
  const riteOfAcceptanceRaw  = str(formData, "riteOfAcceptanceDate");
  const electionDateRaw      = str(formData, "electionDate");
  const easterVigilRaw       = str(formData, "easterVigilDate");
  const completedAtRaw       = str(formData, "completedAt");

  await prisma.sacramentalRecord.upsert({
    where: { participantId },
    create: {
      participantId,
      isBaptized:              bool(formData, "isBaptized"),
      baptismType:             baptismType(formData),
      baptismDenomination:     str(formData, "baptismDenomination"),
      baptismDate:             baptismDateRaw ? new Date(baptismDateRaw) : null,
      baptismParish:           str(formData, "baptismParish"),
      baptismProofStatus:      baptismProof(formData),
      hasFirstCommunion:       bool(formData, "hasFirstCommunion"),
      hasConfirmation:         bool(formData, "hasConfirmation"),
      marriageStatus:          str(formData, "marriageStatus"),
      marriedToCatholic:       bool(formData, "marriedToCatholic"),
      marriedByCatholicPriest: bool(formData, "marriedByCatholicPriest"),
      hadPriorMarriage:        bool(formData, "hadPriorMarriage"),
      spouseHadPriorMarriage:  bool(formData, "spouseHadPriorMarriage"),
      marriageCertReceived:    boolDefault(formData, "marriageCertReceived", false),
      annulmentStatus:         str(formData, "annulmentStatus"),
      hasChildren:             bool(formData, "hasChildren"),
      childrenNotes:           str(formData, "childrenNotes"),
      riteOfAcceptanceDate:    riteOfAcceptanceRaw  ? new Date(riteOfAcceptanceRaw)  : null,
      electionDate:            electionDateRaw       ? new Date(electionDateRaw)       : null,
      easterVigilDate:         easterVigilRaw        ? new Date(easterVigilRaw)        : null,
      completedAt:             completedAtRaw        ? new Date(completedAtRaw)        : null,
    },
    update: {
      isBaptized:              bool(formData, "isBaptized"),
      baptismType:             baptismType(formData),
      baptismDenomination:     str(formData, "baptismDenomination"),
      baptismDate:             baptismDateRaw ? new Date(baptismDateRaw) : null,
      baptismParish:           str(formData, "baptismParish"),
      baptismProofStatus:      baptismProof(formData),
      hasFirstCommunion:       bool(formData, "hasFirstCommunion"),
      hasConfirmation:         bool(formData, "hasConfirmation"),
      marriageStatus:          str(formData, "marriageStatus"),
      marriedToCatholic:       bool(formData, "marriedToCatholic"),
      marriedByCatholicPriest: bool(formData, "marriedByCatholicPriest"),
      hadPriorMarriage:        bool(formData, "hadPriorMarriage"),
      spouseHadPriorMarriage:  bool(formData, "spouseHadPriorMarriage"),
      marriageCertReceived:    boolDefault(formData, "marriageCertReceived", false),
      annulmentStatus:         str(formData, "annulmentStatus"),
      hasChildren:             bool(formData, "hasChildren"),
      childrenNotes:           str(formData, "childrenNotes"),
      riteOfAcceptanceDate:    riteOfAcceptanceRaw  ? new Date(riteOfAcceptanceRaw)  : null,
      electionDate:            electionDateRaw       ? new Date(electionDateRaw)       : null,
      easterVigilDate:         easterVigilRaw        ? new Date(easterVigilRaw)        : null,
      completedAt:             completedAtRaw        ? new Date(completedAtRaw)        : null,
    },
  });

  revalidatePath(`/participants/${participantId}`);
  redirect(`/participants/${participantId}?tab=sacramental`);
}

export async function uploadParticipantPhoto(
  participantId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") return { error: "Admin access required." };

  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return { error: "No file selected." };

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
  if (!allowed.includes(file.type)) return { error: "Only JPEG, PNG, WebP, or HEIC images are accepted." };

  const ext  = file.name.split(".").pop() ?? "jpg";
  const path = `${participantId}.${ext}`;

  const supabase = createAdminClient();
  const { error: uploadError } = await supabase.storage
    .from("participant-photos")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: `Upload failed: ${uploadError.message}` };

  const { data: { publicUrl } } = supabase.storage
    .from("participant-photos")
    .getPublicUrl(path);

  await prisma.participant.update({
    where: { id: participantId },
    data: { photoUrl: publicUrl },
  });

  revalidatePath(`/participants/${participantId}`);
  return {};
}
