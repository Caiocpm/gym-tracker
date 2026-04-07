-- CreateTable
CREATE TABLE "ProfessionalRating" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalRating_professionalId_studentUserId_key" ON "ProfessionalRating"("professionalId", "studentUserId");

-- AddForeignKey
ALTER TABLE "ProfessionalRating" ADD CONSTRAINT "ProfessionalRating_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "ProfessionalProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalRating" ADD CONSTRAINT "ProfessionalRating_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
