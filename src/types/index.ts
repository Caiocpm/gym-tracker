// src/types/index.ts

// ✅ Importar MuscleGroup de shared.ts (única fonte de verdade)
import type { MuscleGroup } from "./shared";

// ✅ NOVO: Interface para dados da série atual
export interface CurrentSetData {
  reps: number;
  weight: number;
  rpe?: number;
  notes: string;
}

// ✅ NOVO: Interface para progresso do exercício
export interface ExerciseProgress {
  execution: ExerciseExecution;
  currentSetData: CurrentSetData;
}

// ✅ NOVO: Interface para progresso de todos os exercícios
export interface WorkoutProgress {
  [exerciseId: string]: ExerciseProgress;
}

// ✅ NOVO: Interface para exercícios concluídos
export interface CompletedExerciseInfo {
  exerciseId: string;
  loggedExercise: LoggedExercise;
  completedAt: string;
}

// ✅ Atualizar WorkoutSession para incluir workoutDayId
export interface WorkoutSession {
  id: string;
  dayId: string;
  workoutDayId: string; // ✅ Adicionar esta propriedade
  date: string;
  startTime: string;
  endTime?: string;
  duration?: number; // Duração em minutos
  exercises: LoggedExercise[];
  notes?: string;
  isStrengthTrainingSession?: boolean; // ✅ Adicionar esta propriedade
}

export interface LoggedExercise {
  id: string;
  workoutSessionId: string;
  exerciseDefinitionId: string;
  exerciseName: string;
  weight: number; // ← Peso médio (mantém compatibilidade)
  sets: number; // ← Número de séries
  reps: number; // ← Reps médias por série (não total!)
  volume: number; // ← Volume total
  date: string;
  dayId: string;
  notes?: string;
  rpe?: number;
  restTime?: number;
  isStrengthTraining?: boolean;
  isPersonalRecord?: boolean; // ✅ Indica se ALGUM set bateu recorde
  completedSets?: Array<{
    // ✅ NOVO: Détalhes de cada série
    setNumber: number;
    reps: number;
    weight: number;
    rpe?: number;
    notes?: string;
    completedAt: string;
    isPersonalRecord?: boolean; // ✅ Indica se ESTE set bateu recorde
  }>;
}

// ✅ Manter PlannedExercise como estava (já está correto)
export interface PlannedExercise {
  id: string;
  exerciseDefinitionId: string;
  name: string;
  plannedSets: number;
  plannedReps: number;
  plannedWeight: number;
  notes: string;
  createdAt: string;
  plannedRestTime?: number;
  autoStartTimer?: boolean;
  isStrengthTraining?: boolean;
  useAdvancedMetrics?: boolean;
  rpe?: number;
  restTimeSeconds?: number;
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  primaryMuscleGroup: MuscleGroup;
  secondaryMuscleGroups?: MuscleGroup[];
  equipment: string;
  instructions?: string[];
  tips?: string[];
  variations?: string[];
  targetMuscles?: string[];
  synergistMuscles?: string[];
  stabilizers?: string[];
  mechanics?: "compound" | "isolation";
  force?: "push" | "pull" | "static";
  level?: "beginner" | "intermediate" | "advanced";
  category?: string;
}

export interface WorkoutDay {
  id: string;
  name: string;
  exercises: PlannedExercise[];
  createdAt?: string; // Data de criação
}

export interface ExecutedSet {
  setNumber: number;
  reps: number;
  weight: number;
  rpe?: number;
  notes?: string;
  completedAt: string;
  restTime?: number;
  isPersonalRecord?: boolean; // ✅ Indica se este set bateu um recorde pessoal
}

export interface ExerciseExecution {
  id: string;
  exerciseId: string;
  exerciseName: string;
  startTime: string;
  currentSet: number;
  totalSets: number;
  isActive: boolean;
  isPaused: boolean;
  completedSets: ExecutedSet[];
  timerConfig: {
    defaultRestTime: number;
    autoStart: boolean;
    enableNotifications: boolean;
    enableSound: boolean;
    enableVibration: boolean;
  };
}

// ✅ ATUALIZAR WorkoutState para incluir novos campos
export interface WorkoutState {
  workoutDays: WorkoutDay[];
  activeDayId: string | null;
  workoutSessions: WorkoutSession[];
  loggedExercises: LoggedExercise[];
  exerciseDefinitions: ExerciseDefinition[];
  activeExecution?: ExerciseExecution;
  timerState?: {
    isActive: boolean;
    timeRemaining: number;
    totalTime: number;
  };
  activeExercise: PlannedExercise | null; // ✅ MUDANÇA: Aceitar null
  exerciseProgress: WorkoutProgress; // ✅ NOVO: Progresso dos exercícios
  completedExercises: Record<string, CompletedExerciseInfo>; // ✅ ATUALIZADO: Informações completas dos exercícios concluídos
  dismissedToasts: Record<string, boolean>; // ✅ NOVO: Rastreamento de toasts descartados por ID
}

// ✅ Re-exportar MuscleGroup para compatibilidade
export type { MuscleGroup };

// ✅ ATUALIZAR WorkoutAction para incluir novas ações
export type WorkoutAction =
  | { type: "SET_ACTIVE_DAY"; payload: string | null }
  | { type: "ADD_WORKOUT_SESSION"; payload: WorkoutSession }
  | { type: "UPDATE_WORKOUT_SESSION"; payload: WorkoutSession }
  | { type: "DELETE_WORKOUT_SESSION"; payload: string }
  | { type: "LOG_EXERCISE"; payload: LoggedExercise }
  | { type: "UPDATE_LOGGED_EXERCISE"; payload: LoggedExercise }
  | { type: "DELETE_LOGGED_EXERCISE"; payload: string }
  | { type: "ADD_WORKOUT_DAY"; payload: WorkoutDay }
  | { type: "UPDATE_WORKOUT_DAY"; payload: WorkoutDay }
  | { type: "DELETE_WORKOUT_DAY"; payload: string }
  | {
      type: "ADD_PLANNED_EXERCISE";
      payload: { dayId: string; exercise: PlannedExercise };
    }
  | {
      type: "UPDATE_PLANNED_EXERCISE";
      payload: { dayId: string; exerciseId: string; exercise: PlannedExercise };
    }
  | {
      type: "DELETE_PLANNED_EXERCISE";
      payload: { dayId: string; exerciseId: string };
    }
  | { type: "ADD_EXERCISE_DEFINITION"; payload: ExerciseDefinition }
  | { type: "UPDATE_EXERCISE_DEFINITION"; payload: ExerciseDefinition }
  | { type: "DELETE_EXERCISE_DEFINITION"; payload: string }
  | { type: "LOAD_DATA"; payload: WorkoutState }
  | { type: "START_EXERCISE_EXECUTION"; payload: ExerciseExecution }
  | { type: "UPDATE_EXERCISE_EXECUTION"; payload: ExerciseExecution }
  | { type: "COMPLETE_EXERCISE_EXECUTION"; payload: LoggedExercise }
  | { type: "CANCEL_EXERCISE_EXECUTION" }
  | { type: "SET_ACTIVE_EXERCISE"; payload: PlannedExercise | null }
  | {
      type: "SAVE_EXERCISE_PROGRESS";
      payload: {
        exerciseId: string;
        execution: ExerciseExecution;
        currentSetData: CurrentSetData;
      };
    }
  | { type: "CLEAR_EXERCISE_PROGRESS"; payload: string }
  | {
      type: "MARK_EXERCISE_COMPLETED";
      payload: { exerciseId: string; loggedExercise: LoggedExercise };
    }
  | { type: "CLEAR_COMPLETED_EXERCISE"; payload: string }
  | { type: "DISMISS_TOAST"; payload: string } // ✅ NOVO: Descartar toast por ID
  | { type: "RESET_TOAST"; payload: string }; // ✅ NOVO: Resetar toast para permitir reaparição
