import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../types/api.types';
import type {
  CreateWorkoutDayInput,
  UpdateWorkoutDayInput,
  CreateWorkoutSessionInput,
  UpdateWorkoutSessionInput,
  CreateLoggedExerciseInput,
  UpdateLoggedExerciseInput,
} from '../schemas/workouts.schemas';

// Enriches planned exercises inside a WorkoutDay with current exerciseType/cardioSubtype
// from ExerciseDefinition, so old exercises stored with wrong defaults are corrected.
// Falls back to name-based matching so stale IDs (from seed rebuilds) are still resolved.
async function enrichDaysWithDefTypes<T extends { exercises: unknown }>(days: T[]): Promise<T[]> {
  if (days.length === 0) return days;

  const hasExercises = days.some(
    (day) => ((day.exercises as Array<unknown>) ?? []).length > 0
  );
  if (!hasExercises) return days;

  const allDefs = await prisma.exerciseDefinition.findMany({
    select: { id: true, name: true, exerciseType: true, cardioSubtype: true },
  });
  const idMap = new Map(allDefs.map((d) => [d.id, d]));
  const nameMap = new Map(allDefs.map((d) => [d.name, d]));

  return days.map((day) => ({
    ...day,
    exercises: ((day.exercises as Array<Record<string, unknown>>) ?? []).map((ex) => {
      const def =
        idMap.get(ex['exerciseDefinitionId'] as string) ??
        nameMap.get(ex['exerciseName'] as string) ??
        null;
      if (!def) return ex;
      return {
        ...ex,
        exerciseType: def.exerciseType,
        cardioSubtype: def.cardioSubtype ?? ex['cardioSubtype'] ?? null,
      };
    }),
  }));
}

// Enriches session exercises with muscleGroup, exerciseType and cardioSubtype
// from ExerciseDefinition. Sessions saved before these fields were included
// (or after a DB migration that changed IDs) will be corrected.
//
// Matching strategy (in order):
//   1. Exact match by exerciseDefinitionId
//   2. Exact match by exerciseName
//   3. Prefix match: definition name starts with the session exercise name
//      (handles "Supino Declinado" → "Supino Declinado com Barra")
//   4. Strip leading emoji and retry (handles "🏊 Natação" → "Natação …")
async function enrichSessionsWithMuscleGroup<T extends { exercises: unknown }>(
  sessions: T[]
): Promise<T[]> {
  if (sessions.length === 0) return sessions;

  // Load all definitions once (small table, ~100-200 rows)
  const allDefs = await prisma.exerciseDefinition.findMany({
    select: { id: true, name: true, primaryMuscleGroup: true, exerciseType: true, cardioSubtype: true },
  });

  const idMap = new Map(allDefs.map((d) => [d.id, d]));
  const nameMap = new Map(allDefs.map((d) => [d.name, d]));

  // Strip leading emoji/symbols so "🏊 Natação" → "Natação"
  function stripEmoji(s: string) {
    return s.replace(/^[\p{Emoji}\p{Symbol}\s]+/u, '').trim();
  }

  function findDef(exId: string | undefined, exName: string | undefined) {
    if (exId) {
      const d = idMap.get(exId);
      if (d) return d;
    }
    if (!exName) return null;
    // Exact name
    const byName = nameMap.get(exName);
    if (byName) return byName;
    // Prefix match
    for (const def of allDefs) {
      if (def.name.startsWith(exName)) return def;
    }
    // Stripped name (remove emoji prefix)
    const stripped = stripEmoji(exName);
    if (stripped !== exName) {
      const byStripped = nameMap.get(stripped);
      if (byStripped) return byStripped;
      for (const def of allDefs) {
        if (def.name.startsWith(stripped)) return def;
      }
    }
    return null;
  }

  return sessions.map((s) => ({
    ...s,
    exercises: ((s.exercises as Array<Record<string, unknown>>) ?? []).map((ex) => {
      const def = findDef(
        ex['exerciseDefinitionId'] as string | undefined,
        ex['exerciseName'] as string | undefined
      );
      if (!def) return ex;
      return {
        ...ex,
        exerciseType: def.exerciseType,
        cardioSubtype: def.cardioSubtype ?? ex['cardioSubtype'] ?? null,
        muscleGroup: ex['muscleGroup'] ?? def.primaryMuscleGroup ?? null,
      };
    }),
  }));
}

export const workoutsService = {
  // ─── Workout Days ───────────────────────────────────────────────────────────

  async listWorkoutDays(userId: string) {
    const days = await prisma.workoutDay.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return enrichDaysWithDefTypes(days);
  },

  async getWorkoutDay(userId: string, dayId: string) {
    const day = await prisma.workoutDay.findFirst({ where: { id: dayId, userId } });
    if (!day) throw new AppError(404, 'Dia de treino não encontrado');
    const [enriched] = await enrichDaysWithDefTypes([day]);
    return enriched;
  },

  async createWorkoutDay(
    userId: string,
    data: CreateWorkoutDayInput,
    createdByProfessionalId?: string,
  ) {
    return prisma.workoutDay.create({
      data: {
        ...data,
        userId,
        ...(createdByProfessionalId ? { createdByProfessionalId } : {}),
      },
    });
  },

  async updateWorkoutDay(userId: string, dayId: string, data: UpdateWorkoutDayInput) {
    const existing = await prisma.workoutDay.findFirst({ where: { id: dayId, userId } });
    if (!existing) throw new AppError(404, 'Dia de treino não encontrado');
    return prisma.workoutDay.update({ where: { id: dayId }, data });
  },

  async deleteWorkoutDay(userId: string, dayId: string) {
    const existing = await prisma.workoutDay.findFirst({ where: { id: dayId, userId } });
    if (!existing) throw new AppError(404, 'Dia de treino não encontrado');
    await prisma.workoutDay.delete({ where: { id: dayId } });
  },

  // ─── Planned Exercises (embedded JSON in WorkoutDay) ──────────────────────

  async addPlannedExercise(userId: string, dayId: string, exercise: Record<string, unknown>) {
    const day = await prisma.workoutDay.findFirst({ where: { id: dayId, userId } });
    if (!day) throw new AppError(404, 'Dia de treino não encontrado');

    const { name, exerciseName, ...rest } = exercise as any;
    const exercises = (day.exercises as Array<Record<string, unknown>>) ?? [];
    const newExercise = {
      ...rest,
      id: crypto.randomUUID(),
      exerciseName: exerciseName ?? name ?? '',
      createdAt: new Date().toISOString(),
    };

    // Devolve o dia atualizado (mobile espera WorkoutDay completo)
    const updated = await prisma.workoutDay.update({
      where: { id: dayId },
      data: { exercises: [...exercises, newExercise] as unknown as Prisma.InputJsonValue },
    });
    const [enriched] = await enrichDaysWithDefTypes([updated]);
    return enriched;
  },

  async updatePlannedExercise(
    userId: string,
    dayId: string,
    exerciseId: string,
    updates: Record<string, unknown>
  ) {
    const day = await prisma.workoutDay.findFirst({ where: { id: dayId, userId } });
    if (!day) throw new AppError(404, 'Dia de treino não encontrado');

    const exercises = (day.exercises as Array<Record<string, unknown>>) ?? [];
    const idx = exercises.findIndex((e) => e['id'] === exerciseId);
    if (idx === -1) throw new AppError(404, 'Exercício não encontrado');

    exercises[idx] = { ...exercises[idx], ...updates, updatedAt: new Date().toISOString() };
    await prisma.workoutDay.update({ where: { id: dayId }, data: { exercises: exercises as unknown as Prisma.InputJsonValue } });
    return exercises[idx];
  },

  async deletePlannedExercise(userId: string, dayId: string, exerciseId: string) {
    const day = await prisma.workoutDay.findFirst({ where: { id: dayId, userId } });
    if (!day) throw new AppError(404, 'Dia de treino não encontrado');

    const exercises = ((day.exercises as Array<Record<string, unknown>>) ?? []).filter(
      (e) => e['id'] !== exerciseId
    );
    await prisma.workoutDay.update({ where: { id: dayId }, data: { exercises: exercises as unknown as Prisma.InputJsonValue } });
  },

  // ─── Workout Sessions ──────────────────────────────────────────────────────

  async listWorkoutSessions(
    userId: string,
    filters: { startDate?: string; endDate?: string; dayId?: string }
  ) {
    const sessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        ...(filters.dayId ? { workoutDayId: filters.dayId } : {}),
        ...(filters.startDate || filters.endDate
          ? {
              date: {
                ...(filters.startDate ? { gte: filters.startDate } : {}),
                ...(filters.endDate ? { lte: filters.endDate } : {}),
              },
            }
          : {}),
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return enrichSessionsWithMuscleGroup(sessions);
  },

  async getWorkoutSession(userId: string, sessionId: string) {
    const session = await prisma.workoutSession.findFirst({ where: { id: sessionId, userId } });
    if (!session) throw new AppError(404, 'Sessão de treino não encontrada');
    return session;
  },

  async createWorkoutSession(userId: string, data: CreateWorkoutSessionInput) {
    const { date, ...rest } = data as any;
    return prisma.workoutSession.create({
      data: {
        ...rest,
        userId,
        date: date ?? new Date().toISOString().split('T')[0],
      },
    });
  },

  async updateWorkoutSession(userId: string, sessionId: string, data: UpdateWorkoutSessionInput) {
    const existing = await prisma.workoutSession.findFirst({ where: { id: sessionId, userId } });
    if (!existing) throw new AppError(404, 'Sessão de treino não encontrada');
    return prisma.workoutSession.update({ where: { id: sessionId }, data });
  },

  async deleteWorkoutSession(userId: string, sessionId: string) {
    const existing = await prisma.workoutSession.findFirst({ where: { id: sessionId, userId } });
    if (!existing) throw new AppError(404, 'Sessão de treino não encontrada');
    await prisma.workoutSession.delete({ where: { id: sessionId } });
  },

  // ─── Logged Exercises ──────────────────────────────────────────────────────

  async listLoggedExercises(
    userId: string,
    filters: { startDate?: string; endDate?: string; exerciseDefinitionId?: string }
  ) {
    return prisma.loggedExercise.findMany({
      where: {
        userId,
        ...(filters.exerciseDefinitionId
          ? { exerciseDefinitionId: filters.exerciseDefinitionId }
          : {}),
        ...(filters.startDate || filters.endDate
          ? {
              date: {
                ...(filters.startDate ? { gte: filters.startDate } : {}),
                ...(filters.endDate ? { lte: filters.endDate } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: 'desc' },
    });
  },

  async createLoggedExercise(userId: string, data: CreateLoggedExerciseInput) {
    const { exerciseDefinitionId, ...rest } = data;
    return prisma.loggedExercise.create({
      data: {
        ...rest,
        userId,
        ...(exerciseDefinitionId ? { exerciseDefinitionId } : {}),
      },
    });
  },

  async updateLoggedExercise(userId: string, exerciseId: string, data: UpdateLoggedExerciseInput) {
    const existing = await prisma.loggedExercise.findFirst({ where: { id: exerciseId, userId } });
    if (!existing) throw new AppError(404, 'Exercício executado não encontrado');
    return prisma.loggedExercise.update({ where: { id: exerciseId }, data });
  },

  async deleteLoggedExercise(userId: string, exerciseId: string) {
    const existing = await prisma.loggedExercise.findFirst({ where: { id: exerciseId, userId } });
    if (!existing) throw new AppError(404, 'Exercício executado não encontrado');
    await prisma.loggedExercise.delete({ where: { id: exerciseId } });
  },
};
