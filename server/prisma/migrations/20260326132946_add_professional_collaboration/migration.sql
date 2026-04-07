-- CreateTable
CREATE TABLE "ProfessionalCollaboration" (
    "id" TEXT NOT NULL,
    "studentLinkId" TEXT NOT NULL,
    "collaboratorId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "scopes" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalCollaboration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalCollaboration_studentLinkId_collaboratorId_key" ON "ProfessionalCollaboration"("studentLinkId", "collaboratorId");

-- AddForeignKey
ALTER TABLE "ProfessionalCollaboration" ADD CONSTRAINT "ProfessionalCollaboration_studentLinkId_fkey" FOREIGN KEY ("studentLinkId") REFERENCES "StudentLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalCollaboration" ADD CONSTRAINT "ProfessionalCollaboration_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalCollaboration" ADD CONSTRAINT "ProfessionalCollaboration_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
