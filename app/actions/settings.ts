"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

export type SettingsFormState = { error?: string; success?: string } | undefined;

function str(formData: FormData, key: string): string | null {
  const val = (formData.get(key) as string)?.trim();
  return val || null;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function createStaffUser(
  _state: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const me = await requireAuth();
  if (me.role !== "ADMIN") return { error: "Admin access required." };

  const email    = str(formData, "email");
  const name     = str(formData, "name");
  const role     = str(formData, "role") as "ADMIN" | "VOLUNTEER" | null;
  const password = str(formData, "password");

  if (!email || !name || !role || !password) {
    return { error: "All fields including password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (error) return { error: `Could not create account: ${error.message}` };

  const supabaseUserId = data.user.id;

  await prisma.user.upsert({
    where: { email },
    create: { supabaseUserId, email, name, role },
    update: { name, role, supabaseUserId },
  });

  revalidatePath("/settings");
  return { success: `Account created for ${name}. Share the password with them directly.` };
}

export async function setUserPassword(
  userId: string,
  _state: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const me = await requireAuth();
  if (me.role !== "ADMIN") return { error: "Admin access required." };

  const password = str(formData, "password");
  if (!password) return { error: "Password is required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found." };

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(user.supabaseUserId, {
    password,
  });

  if (error) return { error: `Could not update password: ${error.message}` };

  return { success: "Password updated." };
}

export async function updateUserRole(userId: string, formData: FormData): Promise<void> {
  const me = await requireAuth();
  if (me.role !== "ADMIN") return;
  if (me.id === userId) return; // can't change own role

  const role = formData.get("role") as "ADMIN" | "VOLUNTEER";
  if (!role) return;

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/settings");
}

export async function removeUser(userId: string): Promise<void> {
  const me = await requireAuth();
  if (me.role !== "ADMIN") return;
  if (me.id === userId) return; // can't delete self

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const supabase = createAdminClient();
  await supabase.auth.admin.deleteUser(user.supabaseUserId);
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/settings");
}

// ── Cycles ────────────────────────────────────────────────────────────────────

export async function createCycle(
  _state: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const me = await requireAuth();
  if (me.role !== "ADMIN") return { error: "Admin access required." };

  const name      = str(formData, "name");
  const yearRaw   = str(formData, "year");
  const startRaw  = str(formData, "startDate");
  const endRaw    = str(formData, "endDate");
  const threshold = parseInt(str(formData, "atRiskThresholdPercent") ?? "75");

  if (!name || !yearRaw) return { error: "Name and year are required." };
  const year = parseInt(yearRaw);
  if (isNaN(year)) return { error: "Year must be a number." };

  await prisma.cycle.create({
    data: {
      name,
      year,
      startDate: startRaw ? new Date(startRaw) : null,
      endDate:   endRaw   ? new Date(endRaw)   : null,
      atRiskThresholdPercent: isNaN(threshold) ? 75 : threshold,
      isCurrent: false,
    },
  });

  revalidatePath("/settings");
  redirect("/settings?tab=cycles");
}

export async function updateCycle(
  cycleId: string,
  _state: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const me = await requireAuth();
  if (me.role !== "ADMIN") return { error: "Admin access required." };

  const name      = str(formData, "name");
  const yearRaw   = str(formData, "year");
  const startRaw  = str(formData, "startDate");
  const endRaw    = str(formData, "endDate");
  const threshold = parseInt(str(formData, "atRiskThresholdPercent") ?? "75");

  if (!name || !yearRaw) return { error: "Name and year are required." };
  const year = parseInt(yearRaw);
  if (isNaN(year)) return { error: "Year must be a number." };

  await prisma.cycle.update({
    where: { id: cycleId },
    data: {
      name,
      year,
      startDate: startRaw ? new Date(startRaw) : null,
      endDate:   endRaw   ? new Date(endRaw)   : null,
      atRiskThresholdPercent: isNaN(threshold) ? 75 : threshold,
    },
  });

  revalidatePath("/settings");
  redirect("/settings?tab=cycles");
}

export async function setCurrentCycle(cycleId: string): Promise<void> {
  const me = await requireAuth();
  if (me.role !== "ADMIN") return;

  await prisma.$transaction([
    prisma.cycle.updateMany({ data: { isCurrent: false } }),
    prisma.cycle.update({ where: { id: cycleId }, data: { isCurrent: true } }),
  ]);

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
