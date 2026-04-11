-- AlterTable
ALTER TABLE "PredefinedFood" ADD COLUMN     "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[];
