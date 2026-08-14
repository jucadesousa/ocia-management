-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false;
