/*
  Warnings:

  - You are about to drop the column `armFlex` on the `BodyMeasurement` table. All the data in the column will be lost.
  - You are about to drop the column `armRelaxed` on the `BodyMeasurement` table. All the data in the column will be lost.
  - You are about to drop the column `calf` on the `BodyMeasurement` table. All the data in the column will be lost.
  - You are about to drop the column `thigh` on the `BodyMeasurement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BodyMeasurement" DROP COLUMN "armFlex",
DROP COLUMN "armRelaxed",
DROP COLUMN "calf",
DROP COLUMN "thigh",
ADD COLUMN     "armFlexLeft" DOUBLE PRECISION,
ADD COLUMN     "armFlexRight" DOUBLE PRECISION,
ADD COLUMN     "armRelaxedLeft" DOUBLE PRECISION,
ADD COLUMN     "armRelaxedRight" DOUBLE PRECISION,
ADD COLUMN     "calfLeft" DOUBLE PRECISION,
ADD COLUMN     "calfRight" DOUBLE PRECISION,
ADD COLUMN     "forearmLeft" DOUBLE PRECISION,
ADD COLUMN     "forearmRight" DOUBLE PRECISION,
ADD COLUMN     "thighLeft" DOUBLE PRECISION,
ADD COLUMN     "thighRight" DOUBLE PRECISION;
