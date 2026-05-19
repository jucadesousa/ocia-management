import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  return prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true, name: true, email: true, role: true },
  });
});

export const requireAuth = cache(async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
});
