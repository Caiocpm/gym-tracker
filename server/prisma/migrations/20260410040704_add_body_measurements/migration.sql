-- CreateTable
CREATE TABLE "BodyMeasurement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "waist" DOUBLE PRECISION,
    "hip" DOUBLE PRECISION,
    "chest" DOUBLE PRECISION,
    "armRelaxed" DOUBLE PRECISION,
    "armFlex" DOUBLE PRECISION,
    "thigh" DOUBLE PRECISION,
    "calf" DOUBLE PRECISION,
    "neck" DOUBLE PRECISION,
    "shoulder" DOUBLE PRECISION,
    "skinfoldChest" DOUBLE PRECISION,
    "skinfoldAxillary" DOUBLE PRECISION,
    "skinfoldTricep" DOUBLE PRECISION,
    "skinfoldSubscapular" DOUBLE PRECISION,
    "skinfoldAbdominal" DOUBLE PRECISION,
    "skinfoldSuprailiac" DOUBLE PRECISION,
    "skinfoldThigh" DOUBLE PRECISION,
    "bodyFatPercent" DOUBLE PRECISION,
    "leanMassKg" DOUBLE PRECISION,
    "fatMassKg" DOUBLE PRECISION,
    "sex" TEXT,
    "age" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodyMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BodyMeasurement_userId_date_idx" ON "BodyMeasurement"("userId", "date");

-- AddForeignKey
ALTER TABLE "BodyMeasurement" ADD CONSTRAINT "BodyMeasurement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
