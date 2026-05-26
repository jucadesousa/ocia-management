-- Convert existing LATE and LEFT_EARLY records to PRESENT
UPDATE "AttendanceRecord" SET status = 'PRESENT' WHERE status = 'LATE';
UPDATE "AttendanceRecord" SET status = 'PRESENT' WHERE status = 'LEFT_EARLY';

-- Swap to a new enum without those two values
CREATE TYPE "AttendanceStatus_new" AS ENUM ('PRESENT', 'ABSENT', 'EXCUSED');

-- Drop the column default before changing the type
ALTER TABLE "AttendanceRecord" ALTER COLUMN status DROP DEFAULT;

ALTER TABLE "AttendanceRecord"
  ALTER COLUMN status TYPE "AttendanceStatus_new"
  USING status::text::"AttendanceStatus_new";

-- Restore the default using the new type
ALTER TABLE "AttendanceRecord" ALTER COLUMN status SET DEFAULT 'ABSENT'::"AttendanceStatus_new";

DROP TYPE "AttendanceStatus";
ALTER TYPE "AttendanceStatus_new" RENAME TO "AttendanceStatus";
