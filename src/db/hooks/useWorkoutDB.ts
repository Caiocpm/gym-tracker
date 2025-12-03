// src/db/hooks/useWorkoutDB.ts
// Hook para operações de treino no IndexedDB

import { useCallback } from "react";
import { db } from "../database";
import type {
  WorkoutDay,
  LoggedExercise,
  WorkoutSession,
  ExerciseProgress,
  CompletedExerciseInfo,
  WorkoutProgress,
} from "../../types";
import { useLiveQuery } from "dexie-react-hooks";
import {
  getDailySnapshot,
  getSnapshotsByDateRange,
  getRecentSnapshots,
  getCurrentMonthStats,
  getSnapshotsByWorkoutDay,
  type DailyWorkoutSnapshot,
} from "../database";

/**
 * 🎯 HOOK PRINCIPAL PARA TREINOS
 *
 * Este hook encapsula todas as operações de treino no IndexedDB.
 * Ele usa `useLiveQuery` do Dexie para atualizar automaticamente
 * quando os dados mudam.
 */

export function useWorkoutDB() {
  // ============================================================================
  //                          QUERIES REATIVAS
  // ============================================================================

  /**
   * 📡 EXPLICAÇÃO: useLiveQuery
   *
   * Este hook do Dexie é MÁGICO! Ele:
   * 1. Executa a query
   * 2. Retorna os dados
   * 3. RE-EXECUTA automaticamente quando os dados mudam no IndexedDB
   *
   * É como um "useState + useEffect" automático!
   */

  // Buscar todos os dias de treino
  const workoutDays = useLiveQuery(() => db.workoutDays.toArray(), []);

  // Buscar exercícios logados dos últimos 30 dias
  const recentExercises = useLiveQuery(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return db.loggedExercises
      .where("date")
      .above(thirtyDaysAgo.toISOString())
      .reverse()
      .toArray();
  }, []);

  // Buscar progresso dos exercícios
  const exerciseProgress = useLiveQuery(async () => {
    const result = await db.appSettings.get("exerciseProgress");
    return (result?.value as WorkoutProgress) || {};
  }, []);

  // Buscar exercícios concluídos
  const completedExercises = useLiveQuery(async () => {
    const result = await db.appSettings.get("completedExercises");
    return (result?.value as Record<string, CompletedExerciseInfo>) || {};
  }, []);

  // Snapshot de hoje
  const todaySnapshot = useLiveQuery(async () => {
    const today = new Date().toISOString().split("T")[0];
    return await getDailySnapshot(today);
  }, []);

  // Últimos 7 dias de snapshots
  const weekSnapshots = useLiveQuery(async () => {
    return await getRecentSnapshots(7);
  }, []);

  // Estatísticas do mês atual
  const monthlyStats = useLiveQuery(async () => {
    return await getCurrentMonthStats();
  }, []);

  // ============================================================================
  //                          OPERAÇÕES DE ESCRITA
  // ============================================================================

  /**
   * ➕ Adiciona um novo dia de treino
   */
  const addWorkoutDay = useCallback(async (day: WorkoutDay) => {
    try {
      await db.workoutDays.add(day);
      console.log("✅ Dia de treino adicionado:", day.name);
      return { success: true };
    } catch (error) {
      console.error("❌ Erro ao adicionar dia de treino:", error);
      return { success: false, error };
    }
  }, []);

  /**
   * ✏️ Atualiza um dia de treino existente
   */
  const updateWorkoutDay = useCallback(
    async (id: string, updates: Partial<WorkoutDay>) => {
      try {
        await db.workoutDays.update(id, updates);
        console.log("✅ Dia de treino atualizado:", id);
        return { success: true };
      } catch (error) {
        console.error("❌ Erro ao atualizar dia de treino:", error);
        return { success: false, error };
      }
    },
    []
  );

  /**
   * 🗑️ Remove um dia de treino
   */
  const deleteWorkoutDay = useCallback(async (id: string) => {
    try {
      await db.workoutDays.delete(id);
      console.log("✅ Dia de treino removido:", id);
      return { success: true };
    } catch (error) {
      console.error("❌ Erro ao remover dia de treino:", error);
      return { success: false, error };
    }
  }, []);

  /**
   * 📝 Loga um exercício realizado
   */
  const logExercise = useCallback(async (exercise: LoggedExercise) => {
    try {
      await db.loggedExercises.add(exercise);
      console.log("✅ Exercício logado:", exercise.exerciseName);
      return { success: true };
    } catch (error) {
      console.error("❌ Erro ao logar exercício:", error);
      return { success: false, error };
    }
  }, []);

  /**
   * 📊 Salva uma sessão de treino completa
   */
  const saveWorkoutSession = useCallback(async (session: WorkoutSession) => {
    try {
      await db.workoutSessions.add(session);
      console.log("✅ Sessão de treino salva:", session.id);
      return { success: true };
    } catch (error) {
      console.error("❌ Erro ao salvar sessão:", error);
      return { success: false, error };
    }
  }, []);

  // ============================================================================
  //                    OPERAÇÕES - EXERCÍCIOS CONCLUÍDOS
  // ============================================================================

  /**
   * ✅ Marca um exercício como concluído
   */
  const markExerciseCompleted = useCallback(
    async (exerciseId: string, loggedExercise: LoggedExercise) => {
      try {
        const current = await db.appSettings.get("completedExercises");
        const completedExercises =
          (current?.value as Record<string, CompletedExerciseInfo>) || {};

        completedExercises[exerciseId] = {
          exerciseId,
          loggedExercise,
          completedAt: new Date().toISOString(),
        };

        await db.appSettings.put({
          key: "completedExercises",
          value: completedExercises,
        });

        console.log("✅ Exercício marcado como concluído:", exerciseId);
        return { success: true };
      } catch (error) {
        console.error("❌ Erro ao marcar exercício como concluído:", error);
        return { success: false, error };
      }
    },
    []
  );

  /**
   * 🗑️ Remove a marcação de exercício concluído
   */
  const clearExerciseCompleted = useCallback(async (exerciseId: string) => {
    try {
      const current = await db.appSettings.get("completedExercises");
      const completedExercises =
        (current?.value as Record<string, CompletedExerciseInfo>) || {};

      delete completedExercises[exerciseId];

      await db.appSettings.put({
        key: "completedExercises",
        value: completedExercises,
      });

      console.log("✅ Marcação de exercício concluído removida:", exerciseId);
      return { success: true };
    } catch (error) {
      console.error("❌ Erro ao limpar exercício concluído:", error);
      return { success: false, error };
    }
  }, []);

  /**
   * 🔍 Verifica se um exercício está concluído
   */
  const isExerciseCompleted = useCallback(
    async (exerciseId: string): Promise<boolean> => {
      try {
        const current = await db.appSettings.get("completedExercises");
        const completedExercises =
          (current?.value as Record<string, CompletedExerciseInfo>) || {};
        return !!completedExercises[exerciseId];
      } catch (error) {
        console.error(
          "❌ Erro ao verificar se exercício está concluído:",
          error
        );
        return false;
      }
    },
    []
  );

  /**
   * 📂 Obtém dados de um exercício concluído
   */
  const getCompletedExerciseData = useCallback(
    async (exerciseId: string): Promise<CompletedExerciseInfo | null> => {
      try {
        const current = await db.appSettings.get("completedExercises");
        const completedExercises =
          (current?.value as Record<string, CompletedExerciseInfo>) || {};
        return completedExercises[exerciseId] || null;
      } catch (error) {
        console.error("❌ Erro ao buscar dados do exercício concluído:", error);
        return null;
      }
    },
    []
  );

  // ============================================================================
  //                    OPERAÇÕES - PROGRESSO DE EXERCÍCIOS
  // ============================================================================

  /**
   * 💾 Salva o progresso de um exercício
   */
  const saveExerciseProgress = useCallback(
    async (exerciseId: string, progress: ExerciseProgress) => {
      try {
        const current = await db.appSettings.get("exerciseProgress");
        const exerciseProgress = (current?.value as WorkoutProgress) || {};

        exerciseProgress[exerciseId] = progress;

        await db.appSettings.put({
          key: "exerciseProgress",
          value: exerciseProgress,
        });

        console.log("✅ Progresso do exercício salvo:", exerciseId);
        return { success: true };
      } catch (error) {
        console.error("❌ Erro ao salvar progresso do exercício:", error);
        return { success: false, error };
      }
    },
    []
  );

  /**
   * 🗑️ Limpa o progresso de um exercício
   */
  const clearExerciseProgress = useCallback(async (exerciseId: string) => {
    try {
      const current = await db.appSettings.get("exerciseProgress");
      const exerciseProgress = (current?.value as WorkoutProgress) || {};

      delete exerciseProgress[exerciseId];

      await db.appSettings.put({
        key: "exerciseProgress",
        value: exerciseProgress,
      });

      console.log("✅ Progresso do exercício limpo:", exerciseId);
      return { success: true };
    } catch (error) {
      console.error("❌ Erro ao limpar progresso do exercício:", error);
      return { success: false, error };
    }
  }, []);

  /**
   * 📂 Obtém o progresso de um exercício
   */
  const getExerciseProgress = useCallback(
    async (exerciseId: string): Promise<ExerciseProgress | null> => {
      try {
        const current = await db.appSettings.get("exerciseProgress");
        const exerciseProgress = (current?.value as WorkoutProgress) || {};
        return exerciseProgress[exerciseId] || null;
      } catch (error) {
        console.error("❌ Erro ao buscar progresso do exercício:", error);
        return null;
      }
    },
    []
  );

  /**
   * 🗑️ Limpa todos os exercícios concluídos e progresso
   */
  const clearAllExerciseData = useCallback(async () => {
    try {
      await db.appSettings.put({ key: "exerciseProgress", value: {} });
      await db.appSettings.put({ key: "completedExercises", value: {} });
      console.log("✅ Todos os dados de progresso e conclusão limpos");
      return { success: true };
    } catch (error) {
      console.error("❌ Erro ao limpar dados de exercícios:", error);
      return { success: false, error };
    }
  }, []);

  // ============================================================================
  //                    QUERIES - HISTÓRICO E SNAPSHOTS
  // ============================================================================

  /**
   * 📸 Busca snapshot de uma data específica
   */
  const getDailyWorkoutSnapshot = useCallback(async (date: string) => {
    return await getDailySnapshot(date);
  }, []);

  /**
   * 📊 Busca snapshots de um período
   */
  const getWorkoutHistory = useCallback(
    async (startDate: string, endDate: string) => {
      return await getSnapshotsByDateRange(startDate, endDate);
    },
    []
  );

  /**
   * 📈 Busca últimos N dias de treino
   */
  const getRecentWorkouts = useCallback(async (days: number = 7) => {
    return await getRecentSnapshots(days);
  }, []);

  /**
   * 📊 Estatísticas do mês atual (não reativa)
   */
  const getMonthlyStats = useCallback(async () => {
    return await getCurrentMonthStats();
  }, []);

  /**
   * 📅 Busca todos os snapshots de um treino específico
   */
  const getWorkoutDayHistory = useCallback(async (workoutDayId: string) => {
    return await getSnapshotsByWorkoutDay(workoutDayId);
  }, []);

  // ============================================================================
  //                          QUERIES CUSTOMIZADAS
  // ============================================================================

  /**
   * 🔍 Busca exercícios por data específica
   */
  const getExercisesByDate = useCallback(async (date: string) => {
    return await db.loggedExercises.where("date").equals(date).toArray();
  }, []);

  /**
   * 🔍 Busca exercícios por período (range)
   */
  const getExercisesByDateRange = useCallback(
    async (startDate: string, endDate: string) => {
      return await db.loggedExercises
        .where("date")
        .between(startDate, endDate, true, true)
        .toArray();
    },
    []
  );

  /**
   * 🔍 Busca exercícios de um dia de treino específico
   */
  const getExercisesByWorkoutDay = useCallback(async (workoutDayId: string) => {
    return await db.loggedExercises
      .where("workoutDayId")
      .equals(workoutDayId)
      .toArray();
  }, []);

  /**
   * 📈 Busca histórico de um exercício específico
   */
  const getExerciseHistory = useCallback(async (exerciseId: string) => {
    return await db.loggedExercises
      .where("exerciseId")
      .equals(exerciseId)
      .reverse()
      .toArray();
  }, []);

  /**
   * 🗓️ Busca sessões de treino do mês atual
   */
  const getCurrentMonthSessions = useCallback(async () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return await db.workoutSessions
      .where("date")
      .between(firstDay.toISOString(), lastDay.toISOString(), true, true)
      .toArray();
  }, []);

  // ============================================================================
  //                          OPERAÇÕES EM LOTE
  // ============================================================================

  /**
   * ⚡ Salva múltiplos exercícios de uma vez (mais eficiente)
   */
  const bulkLogExercises = useCallback(async (exercises: LoggedExercise[]) => {
    try {
      await db.loggedExercises.bulkAdd(exercises);
      console.log(`✅ ${exercises.length} exercícios logados em lote`);
      return { success: true };
    } catch (error) {
      console.error("❌ Erro ao logar exercícios em lote:", error);
      return { success: false, error };
    }
  }, []);

  // ============================================================================
  //                          RETORNO DO HOOK
  // ============================================================================

  return {
    // Dados reativos (atualizam automaticamente)
    workoutDays,
    recentExercises,
    exerciseProgress,
    completedExercises,
    todaySnapshot,
    weekSnapshots,
    monthlyStats,

    // Operações de escrita
    addWorkoutDay,
    updateWorkoutDay,
    deleteWorkoutDay,
    logExercise,
    saveWorkoutSession,
    bulkLogExercises,

    // Operações de exercícios concluídos
    markExerciseCompleted,
    clearExerciseCompleted,
    isExerciseCompleted,
    getCompletedExerciseData,

    // Operações de progresso
    saveExerciseProgress,
    clearExerciseProgress,
    getExerciseProgress,
    clearAllExerciseData,

    // Queries de histórico e snapshots
    getDailyWorkoutSnapshot,
    getWorkoutHistory,
    getRecentWorkouts,
    getMonthlyStats,
    getWorkoutDayHistory,

    // Queries customizadas
    getExercisesByDate,
    getExercisesByDateRange,
    getExercisesByWorkoutDay,
    getExerciseHistory,
    getCurrentMonthSessions,

    // Estado de carregamento
    isLoading:
      workoutDays === undefined ||
      recentExercises === undefined ||
      exerciseProgress === undefined ||
      completedExercises === undefined,
  };
}

/**
 * 🎯 EXEMPLO DE USO COMPLETO EM UM COMPONENTE:
 *
 * ```tsx
 * function WorkoutExecution() {
 *   const {
 *     workoutDays,
 *     completedExercises,
 *     markExerciseCompleted,
 *     isExerciseCompleted,
 *     logExercise,
 *     isLoading
 *   } = useWorkoutDB();
 *
 *   const handleCompleteExercise = async (exerciseId: string) => {
 *     // 1. Criar LoggedExercise
 *     const loggedExercise = {
 *       id: `logged-${Date.now()}`,
 *       exerciseId,
 *       // ... outros dados
 *     };
 *
 *     // 2. Salvar no histórico
 *     await logExercise(loggedExercise);
 *
 *     // 3. Marcar como concluído
 *     await markExerciseCompleted(exerciseId, loggedExercise);
 *   };
 *
 *   // Verificar se exercício está concluído
 *   const isCompleted = await isExerciseCompleted('ex-a1');
 *
 *   return (
 *     <div>
 *       {workoutDays?.map(day => (
 *         <div key={day.id}>
 *           {day.exercises.map(ex => (
 *             <ExerciseCard
 *               key={ex.id}
 *               exercise={ex}
 *               isCompleted={completedExercises?.[ex.id]}
 *               onComplete={() => handleCompleteExercise(ex.id)}
 *             />
 *           ))}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

// Exportar tipo do snapshot para uso em componentes
export type { DailyWorkoutSnapshot };
