-- AlterTable
ALTER TABLE "ChallengeParticipant" ADD COLUMN     "completedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "ChallengeParticipant" ADD CONSTRAINT "ChallengeParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
