-- Enable Row Level Security on all public schema tables.
-- Prisma connects via the postgres superuser role (DATABASE_URL direct connection)
-- which bypasses RLS entirely, so this has no impact on the application.
-- This closes off unauthenticated access via the Supabase REST API (PostgREST).

ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Cycle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Participant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."AttendanceRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."SacramentalRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
