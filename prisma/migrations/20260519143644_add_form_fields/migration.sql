-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "city" TEXT,
ADD COLUMN     "interviewDate" TIMESTAMP(3),
ADD COLUMN     "maidenName" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "phoneWork" TEXT,
ADD COLUMN     "placeOfBirth" TEXT,
ADD COLUMN     "spouseName" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- AlterTable
ALTER TABLE "SacramentalRecord" ADD COLUMN     "baptismDenomination" TEXT,
ADD COLUMN     "childrenNotes" TEXT,
ADD COLUMN     "hadPriorMarriage" BOOLEAN,
ADD COLUMN     "hasChildren" BOOLEAN,
ADD COLUMN     "marriedByCatholicPriest" BOOLEAN,
ADD COLUMN     "marriedToCatholic" BOOLEAN,
ADD COLUMN     "spouseHadPriorMarriage" BOOLEAN;
