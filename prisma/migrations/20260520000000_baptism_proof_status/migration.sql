-- CreateEnum
CREATE TYPE "BaptismProofStatus" AS ENUM ('NONE', 'CERTIFICATE', 'LETTER', 'OTHER');

-- Add new column defaulting to NONE
ALTER TABLE "SacramentalRecord" ADD COLUMN "baptismProofStatus" "BaptismProofStatus" NOT NULL DEFAULT 'NONE';

-- Migrate existing data: previously-confirmed certs map to CERTIFICATE
UPDATE "SacramentalRecord" SET "baptismProofStatus" = 'CERTIFICATE' WHERE "baptismCertReceived" = true;

-- Drop old column
ALTER TABLE "SacramentalRecord" DROP COLUMN "baptismCertReceived";
