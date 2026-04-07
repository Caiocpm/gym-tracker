import { z } from 'zod';

// ─── PlannedExercise ──────────────────────────────────────────────────────────

const wodMovementSchema = z.object({
  name: z.string().min(1),
  targetReps: z.number().int().nonnegative().optional(),
  targetWeight: z.number().nonnegative().optional(),
  actualReps: z.number().int().nonnegative().optional(),
  actualWeight: z.number().nonnegative().optional(),
});

export const plannedExerciseSchema = z.object({
  exerciseDefinitionId: z.string().optional(),
  // Aceita tanto "name" quanto "exerciseName" (mobile)
  name: z.string().optional(),
  exerciseName: z.string().optional(),
  sets: z.number().int().positive().optional(),
  reps: z.number().int().nonnegative().optional(),
  weight: z.number().nonnegative().optional(),
  restTime: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
  order: z.number().int().nonnegative().optional(),
  // Cardio / CrossFit
  exerciseType: z.string().optional(),
  cardioSubtype: z.string().optional(),
  plannedDurationMinutes: z.number().int().nonnegative().optional(),
  plannedDistanceKm: z.number().nonnegative().optional(),
  intensity: z.string().optional(),
  runType: z.string().optional(),
  plannedPoolLengthM: z.number().int().nonnegative().optional(),
  plannedSwimStyle: z.string().optional(),
  wodFormat: z.string().optional(),
  wodDescription: z.string().optional(),
  plannedRounds: z.number().int().positive().optional(),
  wodMovements: z.array(wodMovementSchema).optional(),
});

// ─── WorkoutDay ───────────────────────────────────────────────────────────────

export const createWorkoutDaySchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  dayType: z.enum(['musculacao', 'cardio', 'crossfit']).optional().default('musculacao'),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  notes: z.string().optional(),
  exercises: z.array(plannedExerciseSchema).optional().default([]),
});

export const updateWorkoutDaySchema = createWorkoutDaySchema.partial();

// ─── PlannedExercise in Day ───────────────────────────────────────────────────

export const addPlannedExerciseSchema = plannedExerciseSchema;
export const updatePlannedExerciseSchema = plannedExerciseSchema.partial();

// ─── WorkoutSession ───────────────────────────────────────────────────────────

const executedSetSchema = z.object({
  reps: z.number().int().nonnegative(),
  weight: z.number().nonnegative(),
  rpe: z.number().min(1).max(10).optional(),
  completionTime: z.number().nonnegative().optional(),
  isPersonalRecord: z.boolean().optional(),
  // Cardio
  durationSeconds: z.number().int().nonnegative().optional(),
  distanceKm: z.number().nonnegative().optional(),
  avgBpm: z.number().int().nonnegative().optional(),
  maxBpm: z.number().int().nonnegative().optional(),
  elevationGainM: z.number().int().nonnegative().optional(),
  runType: z.string().optional(),
  intensity: z.string().optional(),
  lapsCount: z.number().int().nonnegative().optional(),
  swimStyle: z.string().optional(),
  kcalBurned: z.number().int().nonnegative().optional(),
  // CrossFit
  completedRounds: z.number().int().nonnegative().optional(),
  partialReps: z.number().int().nonnegative().optional(),
  wodMovements: z.array(wodMovementSchema).optional(),
});

const loggedExerciseSchema = z.object({
  exerciseDefinitionId: z.string().optional(),
  exerciseName: z.string().min(1),
  muscleGroup: z.string().optional(),
  exerciseType: z.string().optional(),
  cardioSubtype: z.string().optional(),
  sets: z.array(executedSetSchema).optional().default([]),
  notes: z.string().optional(),
  volume: z.number().nonnegative().optional(),
  isPersonalRecord: z.boolean().optional(),
  // CrossFit
  wodFormat: z.string().optional(),
  wodDescription: z.string().optional(),
  plannedRounds: z.number().int().nonnegative().optional(),
});

export const createWorkoutSessionSchema = z.object({
  workoutDayId: z.string().optional(),
  workoutName: z.string().optional(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  exercises: z.array(loggedExerciseSchema).optional().default([]),
  isStrengthTrainingSession: z.boolean().optional().default(true),
  trainingMode: z.enum(['forca', 'resistencia']).optional(),
  sessionAvgBpm: z.number().int().nonnegative().optional(),
  sessionKcal: z.number().int().nonnegative().optional(),
});

export const updateWorkoutSessionSchema = createWorkoutSessionSchema.partial();

// ─── LoggedExercise ───────────────────────────────────────────────────────────

export const createLoggedExerciseSchema = z.object({
  workoutSessionId: z.string().optional(),
  exerciseDefinitionId: z.string().optional(),
  exerciseName: z.string().min(1),
  weight: z.number().nonnegative().optional(),
  sets: z.number().int().nonnegative().optional(),
  reps: z.number().int().nonnegative().optional(),
  volume: z.number().nonnegative().optional(),
  date: z.string().min(1),
  dayId: z.string().optional(),
  notes: z.string().optional(),
  rpe: z.number().min(1).max(10).optional(),
  isStrengthTraining: z.boolean().optional().default(true),
  completedSets: z.array(executedSetSchema).optional().default([]),
});

export const updateLoggedExerciseSchema = createLoggedExerciseSchema.partial();

// ─── Query Params ─────────────────────────────────────────────────────────────

export const listSessionsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  dayId: z.string().optional(),
});

export const listLoggedExercisesQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  exerciseDefinitionId: z.string().optional(),
});

export type CreateWorkoutDayInput = z.infer<typeof createWorkoutDaySchema>;
export type UpdateWorkoutDayInput = z.infer<typeof updateWorkoutDaySchema>;
export type CreateWorkoutSessionInput = z.infer<typeof createWorkoutSessionSchema>;
export type UpdateWorkoutSessionInput = z.infer<typeof updateWorkoutSessionSchema>;
export type CreateLoggedExerciseInput = z.infer<typeof createLoggedExerciseSchema>;
export type UpdateLoggedExerciseInput = z.infer<typeof updateLoggedExerciseSchema>;
