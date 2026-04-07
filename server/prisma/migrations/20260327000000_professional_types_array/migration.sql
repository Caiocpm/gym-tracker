-- Migration: professionalType String → professionalTypes String[]
-- Preserva os dados existentes copiando o valor atual para o array

ALTER TABLE "ProfessionalProfile" ADD COLUMN "professionalTypes" TEXT[] NOT NULL DEFAULT '{}';

UPDATE "ProfessionalProfile"
SET "professionalTypes" = ARRAY["professionalType"];

ALTER TABLE "ProfessionalProfile" DROP COLUMN "professionalType";
