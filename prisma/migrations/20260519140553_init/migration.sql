-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'VOLUNTEER');

-- CreateEnum
CREATE TYPE "Group" AS ENUM ('ENGLISH', 'SPANISH');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "OciaStage" AS ENUM ('INQUIRY', 'CATECHUMEN', 'CANDIDATE', 'ELECT', 'MYSTAGOGY', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('WEEKLY', 'REFLECTION');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('PLANNED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'LEFT_EARLY', 'EXCUSED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('BAPTISM_CERT', 'MARRIAGE_DOC', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VOLUNTEER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cycle" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "atRiskThresholdPercent" INTEGER NOT NULL DEFAULT 75,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "eligibilityVerified" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "preferredName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "photoUrl" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "currentReligion" TEXT,
    "maritalStatus" TEXT,
    "group" "Group" NOT NULL,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'ACTIVE',
    "ociaStage" "OciaStage" NOT NULL DEFAULT 'INQUIRY',
    "cycleId" TEXT NOT NULL,
    "sponsorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SacramentalRecord" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "isBaptized" BOOLEAN,
    "baptismDate" TIMESTAMP(3),
    "baptismParish" TEXT,
    "baptismCertReceived" BOOLEAN NOT NULL DEFAULT false,
    "hasFirstCommunion" BOOLEAN,
    "hasConfirmation" BOOLEAN,
    "marriageStatus" TEXT,
    "marriageCertReceived" BOOLEAN NOT NULL DEFAULT false,
    "annulmentStatus" TEXT,
    "riteOfAcceptanceDate" TIMESTAMP(3),
    "electionDate" TIMESTAMP(3),
    "easterVigilDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SacramentalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT,
    "date" TIMESTAMP(3),
    "type" "SessionType" NOT NULL DEFAULT 'WEEKLY',
    "status" "SessionStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "group" "Group" NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseUserId_key" ON "User"("supabaseUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SacramentalRecord_participantId_key" ON "SacramentalRecord"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_cycleId_type_number_key" ON "Session"("cycleId", "type", "number");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_participantId_sessionId_key" ON "AttendanceRecord"("participantId", "sessionId");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SacramentalRecord" ADD CONSTRAINT "SacramentalRecord_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
