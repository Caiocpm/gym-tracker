-- Add contractedTypes to StudentLink
-- Stores which of the professional's specialties the student contracted.
-- Empty array means "all types" (legacy links created before this feature).
ALTER TABLE "StudentLink" ADD COLUMN "contractedTypes" TEXT[] NOT NULL DEFAULT '{}';
