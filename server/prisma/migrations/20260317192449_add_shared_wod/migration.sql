-- CreateTable
CREATE TABLE "SharedWod" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "timeCap" INTEGER,
    "rounds" INTEGER,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedWod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedWod_code_key" ON "SharedWod"("code");

-- AddForeignKey
ALTER TABLE "SharedWod" ADD CONSTRAINT "SharedWod_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedWod" ADD CONSTRAINT "SharedWod_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
