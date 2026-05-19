"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { AttendanceStatus, Group } from "@prisma/client";

export type AttendanceFormState = { error?: string; saved?: boolean } | undefined;

export async function saveAttendance(
  _state: AttendanceFormState,
  formData: FormData
): Promise<AttendanceFormState> {
  await requireAuth();

  const sessionId = formData.get("sessionId") as string;
  const group = formData.get("group") as Group;

  if (!sessionId) return { error: "Session is required." };
  if (!group) return { error: "Group is required." };

  const upserts: Promise<unknown>[] = [];

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("s_")) {
      const participantId = key.slice(2);
      const status = value as AttendanceStatus;
      upserts.push(
        prisma.attendanceRecord.upsert({
          where: { participantId_sessionId: { participantId, sessionId } },
          create: { participantId, sessionId, group, status },
          update: { status },
        })
      );
    }
  }

  await Promise.all(upserts);

  revalidatePath("/attendance");
  return { saved: true };
}
