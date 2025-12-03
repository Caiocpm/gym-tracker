// src/contexts/WorkoutProviderIndexedDB.tsx
import { useReducer, useEffect, useRef, useCallback, useState } from "react";
import type { ReactNode } from "react";
import { WorkoutContext, workoutReducer, initialState } from "./WorkoutContext";
import type {
  WorkoutContextType,
  WorkoutState,
  WorkoutProgress,
  CompletedExerciseInfo,
} from "./WorkoutContext";
import { db, createDailySnapshot } from "../db/database";
import { migrateFromLocalStorage, seedExerciseDefinitions } from "../db/migrations";

interface WorkoutProviderProps {
  children: ReactNode;
}

const STATE_VERSION = "3.0-indexeddb";

export function WorkoutProvider({ children }: WorkoutProviderProps) {
  const isInitialLoad = useRef(true);
  const isSaving = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // ============================================================================
  //                          CARREGAR ESTADO INICIAL
  // ============================================================================

  const loadInitialState = useCallback(async (): Promise<WorkoutState> => {
    try {
      const workoutDays = await db.workoutDays.toArray();
      const workoutSessions = await db.workoutSessions.toArray();
      const loggedExercises = await db.loggedExercises.toArray();
      const exerciseDefinitions = await db.exerciseDefinitions.toArray();
      const settings = await db.appSettings.get("activeDayId");
      const progressSettings = await db.appSettings.get("exerciseProgress");
      const completedSettings = await db.appSettings.get("completedExercises");

      if (workoutDays.length > 0) {
        console.log("📂 Carregando estado do IndexedDB");

        return {
          ...initialState,
          workoutDays,
          workoutSessions: workoutSessions || [],
          loggedExercises: loggedExercises || [],
          exerciseDefinitions: exerciseDefinitions || [],
          activeDayId: (settings?.value as string) || "workout-a",
          activeExecution: undefined,
          timerState: undefined,
          activeExercise: null,
          exerciseProgress: (progressSettings?.value as WorkoutProgress) || {},
          completedExercises:
            (completedSettings?.value as Record<
              string,
              CompletedExerciseInfo
            >) || {},
        };
      }

      console.log("🔄 Migrando dados do localStorage para IndexedDB...");
      await migrateFromLocalStorage();

      const migratedDays = await db.workoutDays.toArray();
      if (migratedDays.length > 0) {
        const migratedSessions = await db.workoutSessions.toArray();
        const migratedExercises = await db.loggedExercises.toArray();
        const migratedDefinitions = await db.exerciseDefinitions.toArray();
        const migratedSettings = await db.appSettings.get("activeDayId");
        const migratedProgress = await db.appSettings.get("exerciseProgress");
        const migratedCompleted = await db.appSettings.get(
          "completedExercises"
        );

        return {
          ...initialState,
          workoutDays: migratedDays,
          workoutSessions: migratedSessions || [],
          loggedExercises: migratedExercises || [],
          exerciseDefinitions: migratedDefinitions || [],
          activeDayId: (migratedSettings?.value as string) || "workout-a",
          activeExecution: undefined,
          timerState: undefined,
          activeExercise: null,
          exerciseProgress: (migratedProgress?.value as WorkoutProgress) || {},
          completedExercises:
            (migratedCompleted?.value as Record<
              string,
              CompletedExerciseInfo
            >) || {},
        };
      }

      console.log("🆕 Usando estado inicial padrão");
      return initialState;
    } catch (error) {
      console.error("❌ Erro ao carregar estado:", error);
      return initialState;
    }
  }, []);

  // ============================================================================
  //                          REDUCER COM ESTADO INICIAL
  // ============================================================================

  const [state, dispatch] = useReducer(workoutReducer, initialState);

  useEffect(() => {
    const init = async () => {
      try {
        // 🌱 PASSO 1: Fazer seed dos exerciseDefinitions (se necessário)
        await seedExerciseDefinitions();

        // 📂 PASSO 2: Carregar estado do IndexedDB
        const loadedState = await loadInitialState();
        dispatch({ type: "LOAD_DATA", payload: loadedState });
        setIsInitialized(true);
        console.log("✅ WorkoutProvider inicializado com IndexedDB");
      } catch (error) {
        console.error("❌ Erro ao inicializar WorkoutProvider:", error);
        setIsInitialized(true);
      }
    };

    init();
  }, [loadInitialState]);

  // ============================================================================
  //                          SALVAR NO INDEXEDDB
  // ============================================================================

  const saveState = useCallback(async (stateToSave: WorkoutState) => {
    if (isSaving.current) {
      console.log("⏳ Salvamento já em andamento, aguardando...");
      return;
    }

    isSaving.current = true;

    try {
      console.log("💾 Salvando estado no IndexedDB...", {
        workoutDays: stateToSave.workoutDays?.length || 0,
        workoutSessions: stateToSave.workoutSessions?.length || 0,
        loggedExercises: stateToSave.loggedExercises?.length || 0,
        exerciseDefinitions: stateToSave.exerciseDefinitions?.length || 0,
        exerciseProgress: Object.keys(stateToSave.exerciseProgress || {})
          .length,
        completedExercises: Object.keys(stateToSave.completedExercises || {})
          .length,
      });

      if (stateToSave.workoutDays && stateToSave.workoutDays.length > 0) {
        await db.workoutDays.bulkPut(stateToSave.workoutDays);
        console.log(
          "✅ Dias de treino salvos:",
          stateToSave.workoutDays.length
        );
      }

      if (
        stateToSave.workoutSessions &&
        stateToSave.workoutSessions.length > 0
      ) {
        await db.workoutSessions.bulkPut(stateToSave.workoutSessions);
        console.log("✅ Sessões salvas:", stateToSave.workoutSessions.length);
      }

      if (
        stateToSave.loggedExercises &&
        stateToSave.loggedExercises.length > 0
      ) {
        await db.loggedExercises.bulkPut(stateToSave.loggedExercises);
        console.log(
          "✅ Exercícios logados salvos:",
          stateToSave.loggedExercises.length
        );
      }

      if (
        stateToSave.exerciseDefinitions &&
        stateToSave.exerciseDefinitions.length > 0
      ) {
        await db.exerciseDefinitions.bulkPut(stateToSave.exerciseDefinitions);
        console.log(
          "✅ Definições salvas:",
          stateToSave.exerciseDefinitions.length
        );
      }

      if (stateToSave.activeDayId) {
        await db.appSettings.put({
          key: "activeDayId",
          value: stateToSave.activeDayId,
        });
        console.log("✅ Dia ativo salvo:", stateToSave.activeDayId);
      }

      if (stateToSave.exerciseProgress) {
        await db.appSettings.put({
          key: "exerciseProgress",
          value: stateToSave.exerciseProgress,
        });
        console.log(
          "✅ Progresso de exercícios salvo:",
          Object.keys(stateToSave.exerciseProgress).length
        );
      }

      if (stateToSave.completedExercises) {
        await db.appSettings.put({
          key: "completedExercises",
          value: stateToSave.completedExercises,
        });
        console.log(
          "✅ Exercícios concluídos salvos:",
          Object.keys(stateToSave.completedExercises).length
        );
      }

      console.log("💾 Estado salvo no IndexedDB com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao salvar estado no IndexedDB:", error);
    } finally {
      isSaving.current = false;
    }
  }, []);

  // ============================================================================
  //                    RESET AUTOMÁTICO DIÁRIO COM SNAPSHOT
  // ============================================================================

  useEffect(() => {
    const handleDayChange = async () => {
      try {
        const lastSessionDateSetting = await db.appSettings.get(
          "lastSessionDate"
        );
        const lastSessionDate = lastSessionDateSetting?.value as
          | string
          | undefined;
        const today = new Date().toISOString().split("T")[0];

        if (lastSessionDate && lastSessionDate !== today) {
          console.log(
            "🌅 Novo dia detectado! Salvando snapshot e resetando..."
          );

          const yesterdayCompleted = await db.appSettings.get(
            "completedExercises"
          );
          const activeDaySetting = await db.appSettings.get("activeDayId");

          if (
            yesterdayCompleted?.value &&
            typeof yesterdayCompleted.value === "object" &&
            Object.keys(yesterdayCompleted.value as Record<string, unknown>)
              .length > 0
          ) {
            const activeDay = state.workoutDays.find(
              (d) => d.id === activeDaySetting?.value
            );

            if (activeDay) {
              await createDailySnapshot(
                lastSessionDate,
                activeDay.id,
                activeDay.name
              );
              console.log(
                "📸 Snapshot do dia anterior salvo:",
                lastSessionDate
              );
            }
          }

          await db.appSettings.put({
            key: "exerciseProgress",
            value: {},
          });
          await db.appSettings.put({
            key: "completedExercises",
            value: {},
          });

          await db.appSettings.put({
            key: "lastSessionDate",
            value: today,
          });

          dispatch({
            type: "LOAD_DATA",
            payload: {
              ...state,
              exerciseProgress: {},
              completedExercises: {},
            },
          });

          console.log("✅ Estado temporário resetado para novo dia");
        } else if (!lastSessionDate) {
          await db.appSettings.put({
            key: "lastSessionDate",
            value: today,
          });
          console.log("📅 Primeira sessão - data inicial definida");
        }
      } catch (error) {
        console.error("❌ Erro ao verificar mudança de dia:", error);
      }
    };

    if (isInitialized) {
      handleDayChange();
    }

    const interval = setInterval(handleDayChange, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isInitialized, state, dispatch]);

  // ============================================================================
  //                    ATUALIZAR SNAPSHOT EM TEMPO REAL
  // ============================================================================

  useEffect(() => {
    const updateSnapshotOnComplete = async () => {
      if (!isInitialized) return;

      const completedSetting = await db.appSettings.get("completedExercises");
      const completedExercises =
        (completedSetting?.value as Record<string, CompletedExerciseInfo>) ||
        {};

      if (Object.keys(completedExercises).length > 0) {
        const today = new Date().toISOString().split("T")[0];
        const activeDaySetting = await db.appSettings.get("activeDayId");
        const activeDay = state.workoutDays.find(
          (d) => d.id === activeDaySetting?.value
        );

        if (activeDay) {
          await createDailySnapshot(today, activeDay.id, activeDay.name);
          console.log("📸 Snapshot atualizado em tempo real");
        }
      }
    };

    if (isInitialized && state.completedExercises) {
      updateSnapshotOnComplete();
    }
  }, [state.completedExercises, isInitialized, state.workoutDays]);

  // ============================================================================
  //                          AUTO-SAVE
  // ============================================================================

  useEffect(() => {
    if (!isInitialized || isInitialLoad.current) {
      if (isInitialLoad.current && isInitialized) {
        isInitialLoad.current = false;
      }
      return;
    }

    const timeoutId = setTimeout(() => {
      saveState(state);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [state, isInitialized, saveState]);

  useEffect(() => {
    if (!isInitialized) return;

    const handleBeforeUnload = () => {
      saveState(state);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveState(state);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [state, isInitialized, saveState]);

  // ============================================================================
  //                          HELPER FUNCTIONS
  // ============================================================================

  const setActiveDay = (dayId: string | null) => {
    dispatch({ type: "SET_ACTIVE_DAY", payload: dayId });
  };

  const clearAllData = async () => {
    try {
      await db.workoutDays.clear();
      await db.workoutSessions.clear();
      await db.loggedExercises.clear();
      await db.exerciseDefinitions.clear();
      await db.appSettings.delete("activeDayId");
      await db.appSettings.delete("exerciseProgress");
      await db.appSettings.delete("completedExercises");
      await db.appSettings.delete("lastSessionDate");

      console.log("🗑️ Todos os dados de treino foram limpos do IndexedDB");

      dispatch({ type: "LOAD_DATA", payload: initialState });
    } catch (error) {
      console.error("❌ Erro ao limpar dados:", error);
    }
  };

  const exportData = async () => {
    try {
      const exportData = {
        version: STATE_VERSION,
        exportDate: new Date().toISOString(),
        appName: "GymTracker",
        data: state,
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `gymtracker-workout-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      link.click();

      URL.revokeObjectURL(url);
      console.log("📥 Dados de treino exportados com sucesso");
    } catch (error) {
      console.error("❌ Erro ao exportar dados:", error);
    }
  };

  const importData = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);

          if (!importedData.data) {
            console.error("❌ Arquivo de backup inválido");
            resolve(false);
            return;
          }

          await saveState(importedData.data);
          dispatch({ type: "LOAD_DATA", payload: importedData.data });

          console.log("✅ Dados de treino importados com sucesso");
          resolve(true);
        } catch (error) {
          console.error("❌ Erro ao importar dados:", error);
          resolve(false);
        }
      };

      reader.readAsText(file);
    });
  };

  const contextValue: WorkoutContextType = {
    state,
    dispatch,
    setActiveDay,
    clearAllData,
    exportData,
    importData,
  };

  return (
    <WorkoutContext.Provider value={contextValue}>
      {children}
    </WorkoutContext.Provider>
  );
}
