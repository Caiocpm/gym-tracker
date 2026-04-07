-- Make studentEmail optional (generic invite codes don't require a target student)
ALTER TABLE "Invitation" ALTER COLUMN "studentEmail" DROP NOT NULL;
