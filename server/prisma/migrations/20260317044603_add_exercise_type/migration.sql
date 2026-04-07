-- AlterTable
ALTER TABLE "ExerciseDefinition" ADD COLUMN     "cardioSubtype" TEXT,
ADD COLUMN     "exerciseType" TEXT NOT NULL DEFAULT 'forca';
