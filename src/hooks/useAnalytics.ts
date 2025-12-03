// src/hooks/useAnalytics.ts

import { useMemo } from "react";
import { useWorkout } from "../contexts/WorkoutContext";
import { useProfile } from "../contexts/ProfileProviderIndexedDB"; // ✅ Importar useProfile
import type { LoggedExercise, MuscleGroup } from "../types"; // ✅ Importa LoggedExercise e MuscleGroup do index.ts
import type {
  // ✅ Adicionado 'type'
  StrengthMetrics,
  MuscleGroupAnalysis,
  ProgressPrediction,
  WorkoutAnalytics,
  ComparisonMetrics,
  RPEAnalysis,
  RestTimeAnalysis,
  TrainingTypeAnalysis,
} from "../types/analytics.ts"; // ✅ Importa tipos de analytics do novo arquivo

import { STRENGTH_STANDARDS, DAY_NAMES } from "../data/constants";

export function useAnalytics() {
  const { state } = useWorkout();
  const { state: profileState } = useProfile(); // ✅ Acessar o estado completo do perfil
  const currentBodyWeight = profileState.profile?.weight ?? 80; // ✅ Usar profileState.profile?.weight

  const calculateOneRepMax = (weight: number, reps: number): number => {
    if (reps === 0) return 0;
    if (reps === 1) return weight;
    return weight * (36 / (37 - reps));
  };

  const getStrengthLevel = (
    oneRepMax: number,
    exerciseName: string,
    bodyWeight: number
  ): StrengthMetrics["strengthLevel"] => {
    const standards = STRENGTH_STANDARDS[exerciseName];
    if (!standards) return "Intermediário";

    const ratio = oneRepMax / bodyWeight;
    if (ratio >= standards.elite) return "Elite";
    if (ratio >= standards.advanced) return "Avançado";
    if (ratio >= standards.intermediate) return "Intermediário";
    return "Iniciante";
  };

  const strengthMetrics = useMemo((): StrengthMetrics[] => {
    if (!state.loggedExercises || state.loggedExercises.length === 0) {
      return [];
    }

    const exerciseGroups: { [key: string]: LoggedExercise[] } = {};

    state.loggedExercises.forEach((entry: LoggedExercise) => {
      // ✅ Tipado entry
      if (!exerciseGroups[entry.exerciseName]) {
        exerciseGroups[entry.exerciseName] = [];
      }
      exerciseGroups[entry.exerciseName].push(entry);
    });

    return Object.entries(exerciseGroups).map(([exerciseName, entries]) => {
      const sortedEntries = entries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const oneRepMaxes = sortedEntries.map(
        (
          entry: LoggedExercise // ✅ Tipado entry
        ) => calculateOneRepMax(entry.weight, entry.reps)
      );
      const currentMax = oneRepMaxes.length > 0 ? Math.max(...oneRepMaxes) : 0;

      const volumeProgression = sortedEntries.map(
        (entry: LoggedExercise) => entry.volume
      ); // ✅ Tipado entry
      const strengthProgression = oneRepMaxes;

      let progressRate = 0;
      if (sortedEntries.length > 1 && currentMax > 0) {
        const firstMax = oneRepMaxes[0];
        const lastMax = oneRepMaxes[oneRepMaxes.length - 1];
        const daysDiff =
          (new Date(sortedEntries[sortedEntries.length - 1].date).getTime() -
            new Date(sortedEntries[0].date).getTime()) /
          (1000 * 60 * 60 * 24);
        const weeksDiff = daysDiff / 7;
        progressRate =
          weeksDiff > 0 && firstMax > 0
            ? (((lastMax - firstMax) / firstMax) * 100) / weeksDiff
            : 0;
      }

      // ✅ CALCULAR NOVAS MÉTRICAS
      const rpeValues = sortedEntries
        .filter((e) => e.rpe !== undefined)
        .map((e) => e.rpe!);
      const averageRPE =
        rpeValues.length > 0
          ? rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length
          : undefined;

      const restTimeValues = sortedEntries
        .filter((e) => e.restTime !== undefined)
        .map((e) => e.restTime!);
      const averageRestTime =
        restTimeValues.length > 0
          ? restTimeValues.reduce((sum, time) => sum + time, 0) /
            restTimeValues.length
          : undefined;

      const strengthTrainingCount = sortedEntries.filter(
        (e) => e.isStrengthTraining
      ).length;
      const strengthTrainingRatio =
        sortedEntries.length > 0
          ? (strengthTrainingCount / sortedEntries.length) * 100
          : undefined;

      return {
        exerciseId: sortedEntries[0]?.exerciseDefinitionId || exerciseName,
        exerciseName,
        oneRepMax: currentMax,
        strengthLevel: getStrengthLevel(
          currentMax,
          exerciseName,
          currentBodyWeight
        ),
        progressRate: Math.round(progressRate * 100) / 100,
        volumeProgression,
        strengthProgression,
        averageRPE,
        rpeProgression: rpeValues,
        averageRestTime,
        strengthTrainingRatio,
      };
    });
  }, [state.loggedExercises, currentBodyWeight]);

  const muscleGroupAnalysis = useMemo((): MuscleGroupAnalysis[] => {
    if (!state.loggedExercises || state.loggedExercises.length === 0) {
      return [];
    }

    // ✅ REFATORADO: Usar exerciseDefinitions como fonte única de verdade
    const getMuscleGroupForExercise = (
      exerciseDefinitionId: string,
      exerciseName: string
    ): MuscleGroup | "Outro" => {
      // Helper para normalização de strings (case-insensitive e sem acentos)
      const normalizeString = (str: string) =>
        str
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s]/g, "")
          .trim();

      // 1️⃣ Prioridade: Buscar por exerciseDefinitionId
      if (exerciseDefinitionId) {
        const exerciseDef = state.exerciseDefinitions.find(
          (def) => def.id === exerciseDefinitionId
        );
        if (exerciseDef) {
          return exerciseDef.primaryMuscleGroup;
        }
      }

      // 2️⃣ Fallback: Buscar por nome (para exercícios legados sem exerciseDefinitionId)
      const normalizedExerciseName = normalizeString(exerciseName);

      // Correspondência exata normalizada
      const exerciseDefByName = state.exerciseDefinitions.find(
        (def) => normalizeString(def.name) === normalizedExerciseName
      );
      if (exerciseDefByName) {
        return exerciseDefByName.primaryMuscleGroup;
      }

      // Correspondência parcial (contém)
      const exerciseDefByPartialMatch = state.exerciseDefinitions.find(
        (def) => {
          const normalizedDefName = normalizeString(def.name);
          return (
            normalizedDefName.includes(normalizedExerciseName) ||
            normalizedExerciseName.includes(normalizedDefName)
          );
        }
      );
      if (exerciseDefByPartialMatch) {
        return exerciseDefByPartialMatch.primaryMuscleGroup;
      }

      // 3️⃣ Último recurso: Retornar "Outro"
      return "Outro";
    };

    const groupData: {
      [key: string]: { volume: number; count: number; exercises: Set<string> };
    } = {};

    // ✅ Inicializar todos os grupos musculares possíveis
    const allMuscleGroups: MuscleGroup[] = [
      "Peito",
      "Costas",
      "Ombros",
      "Pernas",
      "Glúteos",
      "Bíceps",
      "Tríceps",
      "Antebraço",
      "Abdômen",
      "Outro",
    ];

    allMuscleGroups.forEach((group) => {
      groupData[group] = { volume: 0, count: 0, exercises: new Set() };
    });

    state.loggedExercises.forEach((entry: LoggedExercise) => {
      // ✅ ATUALIZADO: Passar exerciseDefinitionId e exerciseName
      const muscleGroup = getMuscleGroupForExercise(
        entry.exerciseDefinitionId,
        entry.exerciseName
      );

      // 🐛 DEBUG: Log temporário para investigar
      if (entry.exerciseName.toLowerCase().includes('tríceps') ||
          entry.exerciseName.toLowerCase().includes('triceps') ||
          entry.exerciseName.toLowerCase().includes('bíceps') ||
          entry.exerciseName.toLowerCase().includes('biceps')) {
        console.log('🔍 DEBUG Analytics:', {
          exerciseName: entry.exerciseName,
          exerciseDefinitionId: entry.exerciseDefinitionId,
          detectedMuscleGroup: muscleGroup,
          volume: entry.volume
        });
      }

      if (muscleGroup && groupData[muscleGroup]) {
        groupData[muscleGroup].volume += entry.volume;
        groupData[muscleGroup].count += 1;
        groupData[muscleGroup].exercises.add(entry.exerciseName);
      }
    });

    const totalVolume = Object.values(groupData).reduce(
      (sum, data) => sum + data.volume,
      0
    );

    return Object.entries(groupData).map(([group, data]) => ({
      group: group as MuscleGroup,
      totalVolume: data.volume,
      exerciseCount: data.exercises.size,
      averageIntensity: data.count > 0 ? data.volume / data.count : 0,
      weeklyProgression: 0,
      balance: totalVolume > 0 ? (data.volume / totalVolume) * 100 : 0,
    }));
  }, [state.loggedExercises, state.exerciseDefinitions]);

  const progressPredictions = useMemo((): ProgressPrediction[] => {
    return strengthMetrics.map((metric) => {
      const baseGrowth = Math.max(0.5, Math.min(5, metric.progressRate));
      const confidence =
        metric.strengthProgression.length > 4
          ? 85
          : metric.strengthProgression.length > 2
          ? 70
          : 50;

      return {
        exerciseId: metric.exerciseId,
        exerciseName: metric.exerciseName,
        currentMax: metric.oneRepMax,
        predictedMax1Month: metric.oneRepMax * (1 + (baseGrowth * 4) / 100),
        predictedMax3Months: metric.oneRepMax * (1 + (baseGrowth * 12) / 100),
        predictedMax6Months: metric.oneRepMax * (1 + (baseGrowth * 24) / 100),
        confidence,
      };
    });
  }, [strengthMetrics]);

  const workoutAnalytics = useMemo((): WorkoutAnalytics => {
    if (!state.loggedExercises || state.loggedExercises.length === 0) {
      return {
        totalWorkouts: 0,
        averageWorkoutDuration: 0,
        mostActiveDay: "Nenhum",
        consistencyScore: 0,
        weeklyFrequency: 0,
        monthlyProgression: 0,
        strengthTrainingPercentage: 0,
        averageRPEAllExercises: 0,
        averageRestTimeCompliance: 0,
      };
    }

    const workoutDays = new Set(
      state.loggedExercises.map((entry: LoggedExercise) =>
        new Date(entry.date).toDateString()
      ) // ✅ Tipado entry
    ).size;

    const dayFrequency: { [key: number]: number } = {};
    state.loggedExercises.forEach((entry: LoggedExercise) => {
      // ✅ Tipado entry
      const day = new Date(entry.date).getDay();
      dayFrequency[day] = (dayFrequency[day] || 0) + 1;
    });

    const mostActiveDayEntry = Object.entries(dayFrequency).reduce(
      (max, [day, count]) =>
        count > max.count ? { day: parseInt(day), count } : max,
      { day: 0, count: 0 }
    );

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentWorkouts = state.loggedExercises.filter(
      (entry: LoggedExercise) => new Date(entry.date) >= thirtyDaysAgo // ✅ Tipado entry
    );
    const recentWorkoutDays = new Set(
      recentWorkouts.map((entry: LoggedExercise) =>
        new Date(entry.date).toDateString()
      ) // ✅ Tipado entry
    ).size;
    const consistencyScore = Math.min(100, (recentWorkoutDays / 20) * 100);

    // ✅ CALCULAR NOVAS MÉTRICAS
    const strengthTrainingCount = state.loggedExercises.filter(
      (e: LoggedExercise) => e.isStrengthTraining
    ).length;
    const strengthTrainingPercentage =
      state.loggedExercises.length > 0
        ? (strengthTrainingCount / state.loggedExercises.length) * 100
        : 0;

    const rpeExercises = state.loggedExercises.filter(
      (e: LoggedExercise) => e.rpe !== undefined
    );
    const averageRPEAllExercises =
      rpeExercises.length > 0
        ? rpeExercises.reduce((sum, e) => sum + (e.rpe || 0), 0) /
          rpeExercises.length
        : 0;

    // Calcular compliance de tempo de descanso (precisa comparar com planejado)
    const exercisesWithRestTime = state.loggedExercises.filter(
      (e: LoggedExercise) => e.restTime !== undefined
    );
    const averageRestTimeCompliance = exercisesWithRestTime.length > 0 ? 85 : 0; // Placeholder, será calculado quando tivermos dados planejados

    return {
      totalWorkouts: workoutDays,
      averageWorkoutDuration: 60,
      mostActiveDay: DAY_NAMES[mostActiveDayEntry.day],
      consistencyScore: Math.round(consistencyScore),
      weeklyFrequency: recentWorkoutDays > 0 ? (recentWorkoutDays * 7) / 30 : 0,
      monthlyProgression: 0,
      strengthTrainingPercentage: Math.round(strengthTrainingPercentage),
      averageRPEAllExercises: Math.round(averageRPEAllExercises * 10) / 10,
      averageRestTimeCompliance: Math.round(averageRestTimeCompliance),
    };
  }, [state.loggedExercises]);

  const comparisonMetrics = useMemo((): ComparisonMetrics => {
    if (!strengthMetrics || strengthMetrics.length === 0) {
      return {
        userLevel: "Iniciante",
        strengthStandards: {},
      };
    }

    const strengthStandards: ComparisonMetrics["strengthStandards"] = {};

    strengthMetrics.forEach((metric) => {
      const standards = STRENGTH_STANDARDS[metric.exerciseName];
      if (standards) {
        const bodyWeight = currentBodyWeight;
        const userRatio = metric.oneRepMax / bodyWeight;

        let percentile = 0;
        if (userRatio >= standards.elite) percentile = 95;
        else if (userRatio >= standards.advanced) percentile = 80;
        else if (userRatio >= standards.intermediate) percentile = 60;
        else if (userRatio >= standards.beginner) percentile = 30;
        else percentile = 10;

        strengthStandards[metric.exerciseId] = {
          beginner: standards.beginner * bodyWeight,
          intermediate: standards.intermediate * bodyWeight,
          advanced: standards.advanced * bodyWeight,
          elite: standards.elite * bodyWeight,
          userPercentile: percentile,
        };
      }
    });

    const averagePercentile =
      Object.values(strengthStandards).reduce(
        (sum, standard) => sum + standard.userPercentile,
        0
      ) / (Object.keys(strengthStandards).length || 1);

    let userLevel: ComparisonMetrics["userLevel"] = "Iniciante";
    if (averagePercentile >= 85) userLevel = "Elite";
    else if (averagePercentile >= 70) userLevel = "Avançado";
    else if (averagePercentile >= 50) userLevel = "Intermediário";

    return {
      userLevel,
      strengthStandards,
    };
  }, [strengthMetrics, currentBodyWeight]);

  // ✅ ANÁLISE DE RPE
  const rpeAnalysis = useMemo((): RPEAnalysis[] => {
    if (!state.loggedExercises || state.loggedExercises.length === 0) {
      return [];
    }

    const exerciseGroups: { [key: string]: LoggedExercise[] } = {};

    state.loggedExercises
      .filter((e) => e.rpe !== undefined)
      .forEach((entry: LoggedExercise) => {
        if (!exerciseGroups[entry.exerciseName]) {
          exerciseGroups[entry.exerciseName] = [];
        }
        exerciseGroups[entry.exerciseName].push(entry);
      });

    return Object.entries(exerciseGroups).map(([exerciseName, entries]) => {
      const sortedEntries = entries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const rpeProgression = sortedEntries.map((e) => e.rpe!);
      const dates = sortedEntries.map((e) => e.date);
      const averageRPE =
        rpeProgression.reduce((sum, rpe) => sum + rpe, 0) /
        rpeProgression.length;

      // Determinar tendência
      let trend: "increasing" | "decreasing" | "stable" = "stable";
      if (rpeProgression.length >= 3) {
        const firstThird = rpeProgression.slice(0, rpeProgression.length / 3);
        const lastThird = rpeProgression.slice(
          (2 * rpeProgression.length) / 3
        );
        const firstAvg =
          firstThird.reduce((sum, rpe) => sum + rpe, 0) / firstThird.length;
        const lastAvg =
          lastThird.reduce((sum, rpe) => sum + rpe, 0) / lastThird.length;

        if (lastAvg > firstAvg + 0.5) trend = "increasing";
        else if (lastAvg < firstAvg - 0.5) trend = "decreasing";
      }

      return {
        exerciseId: sortedEntries[0]?.exerciseDefinitionId || exerciseName,
        exerciseName,
        averageRPE: Math.round(averageRPE * 10) / 10,
        rpeProgression,
        dates,
        trend,
      };
    });
  }, [state.loggedExercises]);

  // ✅ ANÁLISE DE TEMPO DE DESCANSO
  const restTimeAnalysis = useMemo((): RestTimeAnalysis[] => {
    if (!state.loggedExercises || state.loggedExercises.length === 0) {
      return [];
    }

    const exerciseGroups: { [key: string]: LoggedExercise[] } = {};

    state.loggedExercises
      .filter((e) => e.restTime !== undefined)
      .forEach((entry: LoggedExercise) => {
        if (!exerciseGroups[entry.exerciseName]) {
          exerciseGroups[entry.exerciseName] = [];
        }
        exerciseGroups[entry.exerciseName].push(entry);
      });

    return Object.entries(exerciseGroups).map(([exerciseName, entries]) => {
      const sortedEntries = entries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const restTimeTrend = sortedEntries.map((e) => e.restTime!);
      const dates = sortedEntries.map((e) => e.date);
      const averageActualRestTime =
        restTimeTrend.reduce((sum, time) => sum + time, 0) /
        restTimeTrend.length;

      // Buscar tempo planejado (do workoutDays)
      const plannedExercise = state.workoutDays
        .flatMap((day) => day.exercises)
        .find((ex) => ex.name === exerciseName);
      const plannedRestTime = plannedExercise?.plannedRestTime || 90;

      // Calcular compliance
      const compliance =
        plannedRestTime > 0
          ? Math.min(100, (averageActualRestTime / plannedRestTime) * 100)
          : 100;

      return {
        exerciseId: sortedEntries[0]?.exerciseDefinitionId || exerciseName,
        exerciseName,
        plannedRestTime,
        averageActualRestTime: Math.round(averageActualRestTime),
        compliance: Math.round(compliance),
        restTimeTrend,
        dates,
      };
    });
  }, [state.loggedExercises, state.workoutDays]);

  // ✅ ANÁLISE DE TIPO DE TREINO
  const trainingTypeAnalysis = useMemo((): TrainingTypeAnalysis => {
    if (!state.loggedExercises || state.loggedExercises.length === 0) {
      return {
        totalSessions: 0,
        strengthSessions: 0,
        hypertrophySessions: 0,
        strengthPercentage: 0,
        hypertrophyPercentage: 0,
        strengthVolumeAverage: 0,
        hypertrophyVolumeAverage: 0,
      };
    }

    const strengthExercises = state.loggedExercises.filter(
      (e) => e.isStrengthTraining
    );
    const hypertrophyExercises = state.loggedExercises.filter(
      (e) => !e.isStrengthTraining
    );

    const totalSessions = state.loggedExercises.length;
    const strengthSessions = strengthExercises.length;
    const hypertrophySessions = hypertrophyExercises.length;

    const strengthVolumeAverage =
      strengthExercises.length > 0
        ? strengthExercises.reduce((sum, e) => sum + e.volume, 0) /
          strengthExercises.length
        : 0;

    const hypertrophyVolumeAverage =
      hypertrophyExercises.length > 0
        ? hypertrophyExercises.reduce((sum, e) => sum + e.volume, 0) /
          hypertrophyExercises.length
        : 0;

    return {
      totalSessions,
      strengthSessions,
      hypertrophySessions,
      strengthPercentage:
        totalSessions > 0 ? (strengthSessions / totalSessions) * 100 : 0,
      hypertrophyPercentage:
        totalSessions > 0 ? (hypertrophySessions / totalSessions) * 100 : 0,
      strengthVolumeAverage: Math.round(strengthVolumeAverage),
      hypertrophyVolumeAverage: Math.round(hypertrophyVolumeAverage),
    };
  }, [state.loggedExercises]);

  return {
    strengthMetrics,
    muscleGroupAnalysis,
    progressPredictions,
    workoutAnalytics,
    comparisonMetrics,
    rpeAnalysis,
    restTimeAnalysis,
    trainingTypeAnalysis,
  };
}
