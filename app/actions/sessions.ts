"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { SessionType, SessionStatus } from "@prisma/client";

export type SessionFormState = { error?: string } | undefined;

function str(formData: FormData, key: string): string | null {
  const val = (formData.get(key) as string)?.trim();
  return val || null;
}

function numField(formData: FormData, key: string): number | null {
  const val = parseInt((formData.get(key) as string) ?? "");
  return isNaN(val) ? null : val;
}

export async function createSession(
  _state: SessionFormState,
  formData: FormData
): Promise<SessionFormState> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") return { error: "Admin access required." };

  const number = numField(formData, "number");
  const type = str(formData, "type") as SessionType | null;

  if (!number || !type) {
    return { error: "Session number and type are required." };
  }

  const cycle = await prisma.cycle.findFirst({ where: { isCurrent: true } });
  if (!cycle) return { error: "No active cycle found. Contact an administrator." };

  const title = str(formData, "title");
  const dateRaw = str(formData, "date");
  const status = (str(formData, "status") as SessionStatus) || "PLANNED";

  await prisma.session.create({
    data: {
      number,
      type,
      title,
      presenter: str(formData, "presenter"),
      date: dateRaw ? new Date(dateRaw) : null,
      status,
      cycleId: cycle.id,
    },
  });

  redirect("/sessions");
}

export async function updateSession(
  id: string,
  _state: SessionFormState,
  formData: FormData
): Promise<SessionFormState> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") return { error: "Admin access required." };

  const number = numField(formData, "number");
  const type = str(formData, "type") as SessionType | null;

  if (!number || !type) {
    return { error: "Session number and type are required." };
  }

  const title = str(formData, "title");
  const dateRaw = str(formData, "date");
  const status = (str(formData, "status") as SessionStatus) || "PLANNED";

  await prisma.session.update({
    where: { id },
    data: {
      number,
      type,
      title,
      presenter: str(formData, "presenter"),
      date: dateRaw ? new Date(dateRaw) : null,
      status,
    },
  });

  revalidatePath("/sessions");
  redirect("/sessions");
}

export async function cancelSession(id: string): Promise<void> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") return;

  await prisma.session.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/sessions");
}

export async function bulkCreateSessions(formData: FormData): Promise<void> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") return;

  const startDateRaw = str(formData, "startDate");
  if (!startDateRaw) return;

  const reflectionCount = numField(formData, "reflectionCount") ?? 4;
  const startDate = new Date(startDateRaw);

  const cycle = await prisma.cycle.findFirst({ where: { isCurrent: true } });
  if (!cycle) return;

  // Create 30 weekly sessions with dates 7 days apart
  for (let i = 1; i <= 30; i++) {
    const sessionDate = new Date(startDate);
    sessionDate.setDate(startDate.getDate() + (i - 1) * 7);

    await prisma.session.upsert({
      where: { cycleId_type_number: { cycleId: cycle.id, type: "WEEKLY", number: i } },
      create: {
        cycleId: cycle.id,
        type: "WEEKLY",
        number: i,
        date: sessionDate,
        status: "PLANNED",
      },
      update: {},
    });
  }

  // Create reflection sessions with no date
  for (let i = 1; i <= reflectionCount; i++) {
    await prisma.session.upsert({
      where: { cycleId_type_number: { cycleId: cycle.id, type: "REFLECTION", number: i } },
      create: {
        cycleId: cycle.id,
        type: "REFLECTION",
        number: i,
        date: null,
        status: "PLANNED",
      },
      update: {},
    });
  }

  revalidatePath("/sessions");
  redirect("/sessions");
}
