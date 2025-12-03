// src/hooks/useUserStats.ts
import { useState, useCallback, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db as firebaseDb } from "../config/firebase";
import { db as indexedDb } from "../db/database";
import { useAuth } from "../contexts/AuthContext";
import { useProfile } from "../contexts/ProfileProviderIndexedDB";
import { useUserBadges } from "./useUserBadges";
import type { UserStats } from "../types/social";
import type { LoggedExercise } from "../types";

// Definir CompletedWorkout localmente já que não existe em workout.ts
interface CompletedWorkout {
  id: string;
  userId: string;
  workoutName: string;
  completedAt: string;
  duration: number;
  exercises: Array<{
    exerciseDefinitionId: string;
    exerciseName: string;
    sets: Array<{
      reps: number;
      weight: number;
      isPersonalRecord?: boolean;
    }>;
  }>;
}

/**
 * Hook para calcular estatísticas completas do usuário
 * Usa IndexedDB como fonte única de verdade para treinos locais
 * Busca dados sociais (grupos, desafios, badges) do Firestore
 */
export function useUserStats() {
  const { currentUser } = useAuth();
  const { state } = useProfile();
  const { getUserBadges } = useUserBadges();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);

  /**
   * ✅ Calcular estatísticas completas do usuário
   */
  const calculateStats = useCallback(
    async (userId?: string): Promise<UserStats | null> => {
      const targetUserId = userId || currentUser?.uid;
      if (!targetUserId) {
        console.error("❌ Usuário não autenticado");
        return null;
      }

      try {
        setLoading(true);
        console.log("📊 Calculando estatísticas para usuário:", targetUserId);

        // ✅ 1. Buscar treinos do IndexedDB (fonte única de verdade)
        const indexedDbExercises = await indexedDb.loggedExercises.toArray();

        const workouts: CompletedWorkout[] = [];

        // Agrupar exercícios por dia de treino
        const exercisesByDate = new Map<string, LoggedExercise[]>();
        indexedDbExercises.forEach((ex) => {
          const dateKey = new Date(ex.date).toISOString().split("T")[0];
          if (!exercisesByDate.has(dateKey)) {
            exercisesByDate.set(dateKey, []);
          }
          exercisesByDate.get(dateKey)!.push(ex);
        });

        // Converter exercícios agrupados em workouts
        exercisesByDate.forEach((exercises, dateKey) => {
          const workout: CompletedWorkout = {
            id: `local-${dateKey}`,
            userId: targetUserId,
            workoutName: exercises[0]?.dayId || "Treino Local",
            completedAt: exercises[0]?.date || new Date(dateKey).toISOString(),
            duration: 0, // Não temos duração em loggedExercises
            exercises: exercises.map((ex) => ({
              exerciseDefinitionId: ex.exerciseDefinitionId || ex.id,
              exerciseName: ex.exerciseName,
              sets: [{
                reps: ex.reps,
                weight: ex.weight,
                isPersonalRecord: ex.isPersonalRecord || false,
              }],
            })),
          };
          workouts.push(workout);
        });

        console.log(`📝 ${workouts.length} treinos encontrados no IndexedDB (${indexedDbExercises.length} exercícios em ${exercisesByDate.size} dias)`);

        // ✅ 2. Calcular estatísticas de treinos
        let totalExercises = 0;
        let totalSets = 0;
        let totalReps = 0;
        let totalVolumeLifted = 0;
        let totalWorkoutTime = 0;
        let totalPersonalRecords = 0;

        let strongestLift: UserStats["strongestLift"] = null;
        let highestVolume: UserStats["highestVolume"] = null;
        let lastWorkoutDate: string | undefined;

        workouts.forEach((workout) => {
          // Exercícios
          totalExercises += workout.exercises.length;

          // Sets, Reps, Volume
          workout.exercises.forEach((exercise) => {
            totalSets += exercise.sets.length;
            exercise.sets.forEach((set) => {
              totalReps += set.reps;
              const volume = set.weight * set.reps;
              totalVolumeLifted += volume;

              // Verificar recorde pessoal (apenas completedWorkouts têm esta informação)
              if (set.isPersonalRecord) {
                totalPersonalRecords++;
                console.log(`🏆 Recorde encontrado: ${exercise.exerciseName} - ${set.weight}kg x ${set.reps} reps`);
              }

              // Verificar strongest lift
              if (!strongestLift || set.weight > strongestLift.weight) {
                strongestLift = {
                  exerciseName: exercise.exerciseName,
                  weight: set.weight,
                  date: workout.completedAt,
                };
              }
            });
          });

          // Volume total do treino
          const workoutVolume = workout.exercises.reduce((sum, ex) => {
            return sum + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0);
          }, 0);

          if (!highestVolume || workoutVolume > highestVolume.volume) {
            highestVolume = {
              workoutName: workout.workoutName,
              volume: workoutVolume,
              date: workout.completedAt,
            };
          }

          // Duração
          if (workout.duration) {
            totalWorkoutTime += workout.duration;
          }

          // Último treino
          if (!lastWorkoutDate || workout.completedAt > lastWorkoutDate) {
            lastWorkoutDate = workout.completedAt;
          }
        });

        const averageWorkoutDuration =
          workouts.length > 0 ? totalWorkoutTime / workouts.length : 0;

        // ✅ 3. Calcular streaks (dias consecutivos)
        const { longestStreak, currentStreak } = calculateStreaks(workouts);

        // ✅ 4. Buscar dados sociais
        const [groupsSnapshot, allChallengesSnapshot, badges] = await Promise.all([
          getDocs(
            query(collection(firebaseDb, "groupMembers"), where("userId", "==", targetUserId))
          ),
          getDocs(collection(firebaseDb, "groupChallenges")),
          getUserBadges(targetUserId),
        ]);

        const totalGroups = groupsSnapshot.size;

        // Filtrar desafios onde o usuário participa
        let totalChallengesJoined = 0;
        let totalChallengesCompleted = 0;

        allChallengesSnapshot.forEach((doc) => {
          const challenge = doc.data();
          const participant = challenge.participants?.find(
            (p: { userId: string; completedAt?: string }) => p.userId === targetUserId
          );

          if (participant) {
            totalChallengesJoined++;
            if (participant.completedAt) {
              totalChallengesCompleted++;
            }
          }
        });

        // ✅ 5. Composição corporal (do ProfileContext)
        const weightChange = calculateWeightChange();
        const bodyFatChange = calculateBodyFatChange();
        const muscleMassChange = calculateMuscleMassChange();

        // ✅ 6. Member since
        const memberSince = currentUser?.metadata.creationTime || new Date().toISOString();

        console.log(`📊 Total de recordes encontrados: ${totalPersonalRecords}`);

        // ✅ 7. Montar objeto de estatísticas
        const userStats: UserStats = {
          // Treinos
          totalWorkouts: workouts.length,
          totalExercises,
          totalSets,
          totalReps,
          totalVolumeLifted,

          // Tempo
          totalWorkoutTime,
          averageWorkoutDuration,
          longestStreak,
          currentStreak,

          // Recordes
          totalPersonalRecords,
          strongestLift,
          highestVolume,

          // Social
          totalGroups,
          totalChallengesJoined,
          totalChallengesCompleted,
          totalBadges: badges.length,

          // Composição Corporal
          weightChange,
          bodyFatChange,
          muscleMassChange,

          // Metadata
          memberSince,
          lastWorkout: lastWorkoutDate,
        };

        console.log("✅ Estatísticas calculadas:", userStats);
        setStats(userStats);
        return userStats;
      } catch (error) {
        console.error("❌ Erro ao calcular estatísticas:", error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [currentUser, getUserBadges]
  );

  /**
   * ✅ Calcular streaks (dias consecutivos de treino)
   */
  const calculateStreaks = (workouts: CompletedWorkout[]) => {
    if (workouts.length === 0) {
      return { longestStreak: 0, currentStreak: 0 };
    }

    // Ordenar por data
    const sortedWorkouts = [...workouts].sort((a, b) => {
      return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
    });

    // Obter dias únicos (formato ISO: YYYY-MM-DD)
    const uniqueDays = new Set<string>();
    sortedWorkouts.forEach((w) => {
      const date = new Date(w.completedAt);
      // Formato: YYYY-MM-DD (ISO date)
      const dayKey = date.toISOString().split("T")[0];
      uniqueDays.add(dayKey);
    });

    const daysArray = Array.from(uniqueDays).sort();

    let longestStreak = 1;
    let currentStreakValue = 1;
    let tempStreak = 1;

    for (let i = 1; i < daysArray.length; i++) {
      const prevDate = new Date(daysArray[i - 1]);
      const currDate = new Date(daysArray[i]);
      const diffDays = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    // Verificar streak atual
    const today = new Date();
    const lastDay = new Date(daysArray[daysArray.length - 1]);
    const diffFromToday = Math.floor(
      (today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffFromToday <= 1) {
      // Se treinou hoje ou ontem, streak continua
      let i = daysArray.length - 1;
      currentStreakValue = 1;
      while (i > 0) {
        const prevDate = new Date(daysArray[i - 1]);
        const currDate = new Date(daysArray[i]);
        const diff = Math.floor(
          (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diff === 1) {
          currentStreakValue++;
          i--;
        } else {
          break;
        }
      }
    } else {
      currentStreakValue = 0;
    }

    return { longestStreak, currentStreak: currentStreakValue };
  };

  /**
   * ✅ Calcular mudança de peso
   */
  const calculateWeightChange = (): UserStats["weightChange"] | undefined => {
    if (!state.measurements || state.measurements.length < 2) {
      return undefined;
    }

    const sorted = [...state.measurements].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    if (!first.weight || !last.weight) return undefined;

    return {
      start: first.weight,
      current: last.weight,
      change: last.weight - first.weight,
      unit: "kg", // Default unit
    };
  };

  /**
   * ✅ Calcular mudança de gordura corporal
   */
  const calculateBodyFatChange = (): UserStats["bodyFatChange"] | undefined => {
    if (!state.measurements || state.measurements.length < 2) {
      return undefined;
    }

    const sorted = [...state.measurements].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const first = sorted.find((m) => m.bodyFat);
    const last = [...sorted].reverse().find((m) => m.bodyFat);

    if (!first?.bodyFat || !last?.bodyFat) return undefined;

    return {
      start: first.bodyFat,
      current: last.bodyFat,
      change: last.bodyFat - first.bodyFat,
    };
  };

  /**
   * ✅ Calcular mudança de massa muscular
   */
  const calculateMuscleMassChange = (): UserStats["muscleMassChange"] | undefined => {
    // muscleMass não existe em BodyMeasurements, retornar undefined
    return undefined;
  };

  // ✅ Auto-calcular estatísticas quando componente monta
  useEffect(() => {
    if (currentUser) {
      calculateStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]);

  return {
    loading,
    stats,
    calculateStats,
    refreshStats: calculateStats,
  };
}
