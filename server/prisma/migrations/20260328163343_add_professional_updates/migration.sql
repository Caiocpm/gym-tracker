-- CreateTable
CREATE TABLE "ProfessionalUpdate" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '📣',
    "title" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalUpdate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProfessionalUpdate" ADD CONSTRAINT "ProfessionalUpdate_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "ProfessionalProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
