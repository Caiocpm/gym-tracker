import prisma from '../config/database';
import { AppError } from '../types/api.types';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

// ─── Content types ────────────────────────────────────────────────────────────

export interface PresetExercise {
  exerciseName: string;
  exerciseDefinitionId?: string;  // present when built from catalog; resolved/created on apply
  muscleGroup?: string;
  exerciseType?: 'forca' | 'cardio';
  sets?: number;
  reps?: number;
  weight?: number;
  restTime?: number;
  plannedDurationMinutes?: number;
  plannedDistanceKm?: number;
  intensity?: string;
  notes?: string;
  order?: number;
}

export interface PresetWorkoutDay {
  name: string;
  dayType?: string;
  dayOfWeek?: number | null;
  notes?: string;
  exercises: PresetExercise[];
}

export interface PresetWorkoutContent {
  days: PresetWorkoutDay[];
}

export interface PresetNutritionItem {
  meal: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  unit: string;
}

export interface PresetNutritionContent {
  goals?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
  };
  items: PresetNutritionItem[];
}

export type PresetContent = PresetWorkoutContent | PresetNutritionContent;

// ─── Service ──────────────────────────────────────────────────────────────────

export const presetService = {

  async list(professionalId: string, type?: string) {
    return prisma.preset.findMany({
      where: { professionalId, ...(type ? { type } : {}) },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async get(presetId: string, professionalId: string) {
    const preset = await prisma.preset.findFirst({ where: { id: presetId, professionalId } });
    if (!preset) throw new AppError(404, 'Preset não encontrado');
    return preset;
  },

  async create(professionalId: string, data: {
    type: 'workout' | 'nutrition';
    name: string;
    description?: string;
    content: PresetContent;
  }) {
    return prisma.preset.create({
      data: {
        professionalId,
        type: data.type,
        name: data.name,
        description: data.description,
        content: data.content as unknown as Prisma.InputJsonValue,
      },
    });
  },

  async update(presetId: string, professionalId: string, data: {
    name?: string;
    description?: string;
    content?: PresetContent;
  }) {
    const preset = await prisma.preset.findFirst({ where: { id: presetId, professionalId } });
    if (!preset) throw new AppError(404, 'Preset não encontrado');
    return prisma.preset.update({
      where: { id: presetId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.content !== undefined && { content: data.content as unknown as Prisma.InputJsonValue }),
      },
    });
  },

  async delete(presetId: string, professionalId: string) {
    const preset = await prisma.preset.findFirst({ where: { id: presetId, professionalId } });
    if (!preset) throw new AppError(404, 'Preset não encontrado');
    await prisma.preset.delete({ where: { id: presetId } });
  },

  // ─── Apply to student ────────────────────────────────────────────────────────

  async applyToStudent(presetId: string, professionalId: string, linkId: string, options?: {
    replaceExisting?: boolean;
    applyGoals?: boolean;
  }) {
    const preset = await prisma.preset.findFirst({ where: { id: presetId, professionalId } });
    if (!preset) throw new AppError(404, 'Preset não encontrado');

    const link = await prisma.studentLink.findFirst({
      where: { id: linkId, professionalId, status: 'active' },
    });
    if (!link) throw new AppError(403, 'Vínculo não encontrado ou inativo');

    const contracted: string[] = (link.contractedTypes as string[]) ?? [];
    if (contracted.length > 0) {
      const canWorkout = contracted.some((t) =>
        ['personal_trainer', 'coach', 'physiotherapist', 'other'].includes(t)
      );
      const canNutrition = contracted.includes('nutritionist');
      if (preset.type === 'workout' && !canWorkout)
        throw new AppError(403, 'Este aluno não possui treino contratado com você');
      if (preset.type === 'nutrition' && !canNutrition)
        throw new AppError(403, 'Este aluno não possui nutrição contratada com você');
    }

    const studentId = link.studentUserId;

    if (preset.type === 'nutrition') {
      const content = preset.content as unknown as PresetNutritionContent;
      if (options?.replaceExisting) {
        await prisma.dietPlanItem.deleteMany({ where: { userId: studentId } });
      }
      if (content.items?.length) {
        await prisma.dietPlanItem.createMany({
          data: content.items.map((item, i) => ({
            userId: studentId,
            name: item.name,
            meal: item.meal,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            quantity: item.quantity,
            unit: item.unit,
            sortOrder: i,
          })),
        });
      }
      if (options?.applyGoals && content.goals) {
        await prisma.nutritionGoals.upsert({
          where: { userId: studentId },
          update: content.goals,
          create: { userId: studentId, ...content.goals },
        });
      }
      return { applied: content.items?.length ?? 0, type: 'nutrition' };
    }

    if (preset.type === 'workout') {
      const content = preset.content as unknown as PresetWorkoutContent;

      // ── Resolve/create ExerciseDefinition IDs for all exercises ────────────
      // Load the existing catalog (global + this professional's custom defs).
      const allDefs = await prisma.exerciseDefinition.findMany({
        where: { OR: [{ createdBy: null }, { createdBy: professionalId }] },
        select: { id: true, name: true, exerciseType: true, cardioSubtype: true, primaryMuscleGroup: true },
      });
      const defByName = new Map(allDefs.map((d) => [d.name.trim().toLowerCase(), d]));

      // Collect unique exercise names that need a definition ID.
      const allExercises = (content.days ?? []).flatMap((d) => d.exercises ?? []);
      const uniqueNames = [...new Set(allExercises.map((ex) => ex.exerciseName.trim()))];

      // Also index by ID so exercises that already carry a definitionId are resolved fast.
      const defById = new Map(allDefs.map((d) => [d.id, d]));

      // For each name not in the catalog, create a new ExerciseDefinition owned
      // by the professional. This gives every exercise a stable ID for PRs,
      // analytics comparisons and future features like the head-to-head chart.
      for (const name of uniqueNames) {
        // Skip if any exercise with this name already has a resolvable ID
        const existingEx = allExercises.find((e) => e.exerciseName.trim() === name);
        if (existingEx?.exerciseDefinitionId && defById.has(existingEx.exerciseDefinitionId)) {
          // Ensure it's also indexed by name for the lookup below
          defByName.set(name.toLowerCase(), defById.get(existingEx.exerciseDefinitionId)!);
          continue;
        }
        if (!defByName.has(name.toLowerCase())) {
          const ex = allExercises.find((e) => e.exerciseName.trim() === name)!;
          const created = await prisma.exerciseDefinition.create({
            data: {
              name,
              exerciseType: ex.exerciseType ?? 'forca',
              cardioSubtype: ex.exerciseType === 'cardio' ? (ex.exerciseName ?? null) : null,
              primaryMuscleGroup: ex.muscleGroup ?? null,
              createdBy: professionalId,
            },
            select: { id: true, name: true, exerciseType: true, cardioSubtype: true, primaryMuscleGroup: true },
          });
          defByName.set(name.toLowerCase(), created);
        }
      }
      // ───────────────────────────────────────────────────────────────────────

      // Always clear all existing workout days before applying the preset
      await prisma.workoutDay.deleteMany({ where: { userId: studentId } });
      const days = content.days ?? [];
      await Promise.all(days.map((day) =>
        prisma.workoutDay.create({
          data: {
            userId: studentId,
            createdByProfessionalId: professionalId,
            name: day.name,
            dayType: day.dayType ?? 'musculacao',
            dayOfWeek: day.dayOfWeek ?? null,
            notes: day.notes ?? null,
            exercises: (day.exercises ?? []).map((ex, i) => {
              const def = defByName.get(ex.exerciseName.trim().toLowerCase());
              return {
                id: crypto.randomUUID(),
                exerciseDefinitionId: def?.id ?? null,
                exerciseName: ex.exerciseName,
                muscleGroup: ex.muscleGroup ?? def?.primaryMuscleGroup ?? null,
                exerciseType: ex.exerciseType ?? def?.exerciseType ?? 'forca',
                sets: ex.sets ?? null,
                reps: ex.reps ?? null,
                weight: ex.weight ?? null,
                restTime: ex.restTime ?? null,
                plannedDurationMinutes: ex.plannedDurationMinutes ?? null,
                plannedDistanceKm: ex.plannedDistanceKm ?? null,
                intensity: ex.intensity ?? null,
                notes: ex.notes ?? null,
                order: i,
              };
            }) as Prisma.InputJsonValue,
          },
        })
      ));
      return { applied: days.length, type: 'workout' };
    }

    throw new AppError(400, 'Tipo de preset inválido');
  },
};
