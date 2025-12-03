// src/hooks/useExerciseRecords.ts
import { useMemo } from 'react';
import { useWorkout } from '../contexts/WorkoutContext';
import type { LoggedExercise } from '../types';

export interface ExerciseRecord {
  maxWeight: number;
  maxVolume: number;
  lastPerformed: LoggedExercise | null;
  totalPerformances: number;
}

export function useExerciseRecords(exerciseDefinitionId: string): ExerciseRecord {
  const { state } = useWorkout();

  const record = useMemo(() => {
    // Filtrar todos os exercícios logados para este exercício específico
    const exerciseHistory = state.loggedExercises.filter(
      (ex) => ex.exerciseDefinitionId === exerciseDefinitionId
    );

    if (exerciseHistory.length === 0) {
      return {
        maxWeight: 0,
        maxVolume: 0,
        lastPerformed: null,
        totalPerformances: 0,
      };
    }

    // Ordenar por data (mais recente primeiro)
    const sortedHistory = [...exerciseHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Encontrar o maior peso já usado
    const maxWeight = Math.max(...exerciseHistory.map((ex) => ex.weight));

    // Encontrar o maior volume já alcançado
    const maxVolume = Math.max(...exerciseHistory.map((ex) => ex.volume));

    return {
      maxWeight,
      maxVolume,
      lastPerformed: sortedHistory[0],
      totalPerformances: exerciseHistory.length,
    };
  }, [state.loggedExercises, exerciseDefinitionId]);

  return record;
}

export function isNewWeightRecord(
  currentWeight: number,
  previousMaxWeight: number
): boolean {
  return currentWeight > previousMaxWeight && previousMaxWeight > 0;
}

export function isNewVolumeRecord(
  currentVolume: number,
  previousMaxVolume: number
): boolean {
  return currentVolume > previousMaxVolume && previousMaxVolume > 0;
}
