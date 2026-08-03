-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('RITE', 'HOLY_WEEK', 'HOLY_DAY', 'FEAST_DAY', 'SPECIAL_SERVICE', 'SUNDAY_MASS', 'TEAM_EVENT', 'OTHER');

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "EventCategory" NOT NULL DEFAULT 'SUNDAY_MASS',
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "location" TEXT,
    "highlight" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarEvent_cycleId_date_idx" ON "CalendarEvent"("cycleId", "date");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enable Row Level Security, consistent with 20260609000000_enable_rls_all_tables.
-- Prisma connects via the postgres superuser role (DATABASE_URL direct connection)
-- which bypasses RLS entirely, so this has no impact on the application.
-- This closes off unauthenticated access via the Supabase REST API (PostgREST).
ALTER TABLE "public"."CalendarEvent" ENABLE ROW LEVEL SECURITY;
