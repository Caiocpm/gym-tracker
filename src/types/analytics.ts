// src/types/analytics.ts

// Importe MuscleGroup do novo arquivo shared.ts
import type { MuscleGroup } from "./shared";

export interface StrengthMetrics {
  exerciseId: string; // ✅ Referência ao id da ExerciseDefinition
  exerciseName: string; // Para display rápido
  oneRepMax: number;
  strengthLevel: "Iniciante" | "Intermediário" | "Avançado" | "Elite";
  progressRate: number; // % de progresso por semana
  volumeProgression: number[]; // Tendência de volume ao longo do tempo
  strengthProgression: number[]; // Tendência de força ao longo do tempo
  // ✅ NOVAS MÉTRICAS
  averageRPE?: number; // RPE médio do exercício
  rpeProgression?: number[]; // Evolução do RPE ao longo do tempo
  averageRestTime?: number; // Tempo de descanso médio (segundos)
  restTimeCompliance?: number; // % de aderência ao tempo planejado
  strengthTrainingRatio?: number; // % de execuções marcadas como treino de força
}

export interface MuscleGroupAnalysis {
  group: MuscleGroup; // ✅ Agora usando MuscleGroup (importado de shared.ts)
  totalVolume: number;
  exerciseCount: number;
  averageIntensity: number; // Ex: Volume médio por exercício ou % do 1RM
  weeklyProgression: number;
  balance: number; // 0-100 (balanceamento em relação a outros grupos)
}

export interface ProgressPrediction {
  exerciseId: string; // ✅ Referência ao id da ExerciseDefinition
  exerciseName: string;
  currentMax: number;
  predictedMax1Month: number;
  predictedMax3Months: number;
  predictedMax6Months: number;
  confidence: number; // 0-100
}

export interface WorkoutAnalytics {
  totalWorkouts: number;
  averageWorkoutDuration: number; // Em minutos
  mostActiveDay: string; // Ex: "Segunda-feira"
  consistencyScore: number; // 0-100
  weeklyFrequency: number;
  monthlyProgression: number; // Ex: % de aumento de volume/força
  // ✅ NOVAS MÉTRICAS
  strengthTrainingPercentage: number; // % de treinos marcados como força
  averageRPEAllExercises: number; // RPE médio geral
  averageRestTimeCompliance: number; // % média de aderência aos tempos de descanso
}

export interface ComparisonMetrics {
  userLevel: "Iniciante" | "Intermediário" | "Avançado" | "Elite";
  strengthStandards: {
    [exerciseId: string]: {
      // ✅ Usando id do exercício como chave
      beginner: number;
      intermediate: number;
      advanced: number;
      elite: number;
      userPercentile: number;
    };
  };
}

// ✅ NOVAS INTERFACES PARA ANÁLISES AVANÇADAS
export interface RPEAnalysis {
  exerciseId: string;
  exerciseName: string;
  averageRPE: number;
  rpeProgression: number[]; // Histórico de RPE
  dates: string[]; // Datas correspondentes
  trend: "increasing" | "decreasing" | "stable"; // Tendência do RPE
}

export interface RestTimeAnalysis {
  exerciseId: string;
  exerciseName: string;
  plannedRestTime: number; // segundos
  averageActualRestTime: number; // segundos
  compliance: number; // % de aderência (0-100)
  restTimeTrend: number[]; // Histórico de tempos
  dates: string[];
}

export interface TrainingTypeAnalysis {
  totalSessions: number;
  strengthSessions: number;
  hypertrophySessions: number;
  strengthPercentage: number;
  hypertrophyPercentage: number;
  strengthVolumeAverage: number;
  hypertrophyVolumeAverage: number;
}

// Opcional: Tipo para agrupar todos os relatórios de analytics
export interface UserAnalyticsReport {
  workoutAnalytics: WorkoutAnalytics;
  strengthMetrics: StrengthMetrics[];
  muscleGroupAnalysis: MuscleGroupAnalysis[];
  progressPrediction: ProgressPrediction[];
  comparisonMetrics: ComparisonMetrics;
  // ✅ NOVOS RELATÓRIOS
  rpeAnalysis: RPEAnalysis[];
  restTimeAnalysis: RestTimeAnalysis[];
  trainingTypeAnalysis: TrainingTypeAnalysis;
}
