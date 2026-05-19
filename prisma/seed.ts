import { PrismaClient, Role, Group, OciaStage, SessionType } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createStaffUser(email: string, name: string, role: Role) {
  // Check if Supabase auth user already exists
  const { data: listData } = await supabase.auth.admin.listUsers();
  const existing = listData?.users.find((u) => u.email === email);

  let supabaseUserId: string;
  if (existing) {
    supabaseUserId = existing.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: "ChangeMe123!",
      email_confirm: true,
    });
    if (error) throw new Error(`Failed to create auth user ${email}: ${error.message}`);
    supabaseUserId = data.user.id;
  }

  return prisma.user.upsert({
    where: { email },
    update: { name, role, supabaseUserId },
    create: { supabaseUserId, email, name, role },
  });
}

async function main() {
  console.log("Seeding database...");

  // ── Cycle ──────────────────────────────────────────────────────────────────
  const cycle = await prisma.cycle.upsert({
    where: { id: "seed-cycle-2026" },
    update: {},
    create: {
      id: "seed-cycle-2026",
      year: 2026,
      name: "OCIA 2025–2026",
      isCurrent: true,
      atRiskThresholdPercent: 75,
    },
  });
  console.log(`Cycle: ${cycle.name}`);

  // ── Staff users ────────────────────────────────────────────────────────────
  const admin = await createStaffUser("admin@stbartholomew.org", "OCIA Director", Role.ADMIN);
  const vol1  = await createStaffUser("volunteer1@stbartholomew.org", "Mary Catechist", Role.VOLUNTEER);
  const vol2  = await createStaffUser("volunteer2@stbartholomew.org", "Jose Catechist", Role.VOLUNTEER);
  console.log(`Users: ${admin.name}, ${vol1.name}, ${vol2.name}`);

  // ── Participants ───────────────────────────────────────────────────────────
  const participantSeeds = [
    { id: "seed-p-1", firstName: "John",    lastName: "Davis",        fullName: "John Davis",        group: Group.ENGLISH, cycleId: cycle.id, ociaStage: OciaStage.INQUIRY },
    { id: "seed-p-2", firstName: "Sarah",   lastName: "Johnson",      fullName: "Sarah Johnson",     group: Group.ENGLISH, cycleId: cycle.id, ociaStage: OciaStage.CATECHUMEN, sponsorName: "Robert Smith" },
    { id: "seed-p-3", firstName: "Michael", lastName: "Brown",        fullName: "Michael Brown",     group: Group.ENGLISH, cycleId: cycle.id, ociaStage: OciaStage.CANDIDATE },
    { id: "seed-p-4", firstName: "María",   lastName: "García López", fullName: "María García López",group: Group.SPANISH, cycleId: cycle.id, ociaStage: OciaStage.INQUIRY },
    { id: "seed-p-5", firstName: "Carlos",  lastName: "Rodríguez",    fullName: "Carlos Rodríguez",  group: Group.SPANISH, cycleId: cycle.id, ociaStage: OciaStage.CATECHUMEN, sponsorName: "Ana Flores" },
    { id: "seed-p-6", firstName: "Elena",   lastName: "Martínez",     fullName: "Elena Martínez",    group: Group.SPANISH, cycleId: cycle.id, ociaStage: OciaStage.INQUIRY },
  ];

  const participants = await Promise.all(
    participantSeeds.map(({ id, ...data }) =>
      prisma.participant.upsert({ where: { id }, update: {}, create: { id, ...data } })
    )
  );
  console.log(`Participants: ${participants.length} upserted`);

  // ── Sessions (first 5 weekly) ──────────────────────────────────────────────
  const sessions = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      prisma.session.upsert({
        where: { cycleId_type_number: { cycleId: cycle.id, type: SessionType.WEEKLY, number: i + 1 } },
        update: {},
        create: {
          cycleId: cycle.id,
          number: i + 1,
          title: `Session ${i + 1}`,
          type: SessionType.WEEKLY,
          status: i < 3 ? "COMPLETED" : "PLANNED",
          date: new Date(2025, 8, 7 + i * 7),
        },
      })
    )
  );
  console.log(`Sessions: ${sessions.length} upserted`);

  console.log("Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
