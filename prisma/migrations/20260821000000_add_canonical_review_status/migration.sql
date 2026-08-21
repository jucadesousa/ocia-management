-- CreateEnum
CREATE TYPE "CanonicalReviewStatus" AS ENUM ('NOT_REVIEWED', 'REFERRED_TO_DEACON', 'CONVALIDATION_SCHEDULED', 'RESOLVED');

-- AlterTable
ALTER TABLE "SacramentalRecord" ADD COLUMN "canonicalReviewStatus" "CanonicalReviewStatus" NOT NULL DEFAULT 'NOT_REVIEWED';
