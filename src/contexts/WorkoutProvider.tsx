// src/contexts/WorkoutProvider.tsx
import { useReducer, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { WorkoutContext, workoutReducer, initialState } from "./WorkoutContext";
import type { WorkoutContextType, WorkoutState } from "./WorkoutContext";

interface WorkoutProviderProps {
  children: ReactNode;
}

const WORKOUT_STATE_KEY = "gym-tracker-workout-state";
const STATE_VERSION = "1.0.0";

export function WorkoutProvider({ children }: WorkoutProviderProps) {
  // ✅ REF para controlar se é a primeira carga
  const isInitialLoad = useRef(true);

  // ✅ FUNÇÃO para carregar estado inicial
  const loadInitialState = (): WorkoutState => {
    try {
      const savedState = localStorage.getItem(WORKOUT_STATE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);

        // ✅ VERIFICAR versão e estrutura
        if (parsedState.version === STATE_VERSION && parsedState.data) {
          console.log("📂 Estado carregado do localStorage");
          return {
            ...initialState,
            ...parsedState.data,
            // ✅ GARANTIR que campos críticos existam
            workoutSessions: parsedState.data.workoutSessions || [],
            loggedExercises: parsedState.data.loggedExercises || [],
            exerciseProgress: parsedState.data.exerciseProgress || {},
            completedExercises: parsedState.data.completedExercises || {},
            // ✅ RESETAR estados temporários
            activeExecution: undefined,
            timerState: undefined,
            activeExercise: null,
          };
        } else {
          console.log(
            "🔄 Versão do estado desatualizada, usando estado inicial"
          );
        }
      }
    } catch (error) {
      console.error("❌ Erro ao carregar estado:", error);
    }

    console.log("🆕 Usando estado inicial padrão");
    return initialState;
  };

  // ✅ REDUCER com estado inicial carregado
  const [state, dispatch] = useReducer(workoutReducer, loadInitialState());

  // ✅ FUNÇÃO para salvar estado
  const saveState = (stateToSave: WorkoutState) => {
    try {
      // ✅ FILTRAR dados temporários que não devem ser persistidos
      const dataToSave = {
        ...stateToSave,
        // Não salvar estados temporários
        activeExecution: undefined,
        timerState: undefined,
        activeExercise: null,
      };

      const stateData = {
        version: STATE_VERSION,
        data: dataToSave,
        lastSaved: new Date().toISOString(),
      };

      localStorage.setItem(WORKOUT_STATE_KEY, JSON.stringify(stateData));
      console.log("💾 Estado salvo no localStorage");
    } catch (error) {
      console.error("❌ Erro ao salvar estado:", error);

      // ✅ TENTAR limpar localStorage se estiver cheio
      if (error instanceof Error && error.name === "QuotaExceededError") {
        console.log("🧹 Limpando dados antigos do localStorage...");
        try {
          // Manter apenas os dados essenciais
          const essentialData = {
            version: STATE_VERSION,
            data: {
              workoutDays: stateToSave.workoutDays,
              workoutSessions: stateToSave.workoutSessions.slice(-50), // Últimas 50 sessões
              loggedExercises: stateToSave.loggedExercises.slice(-100), // Últimos 100 exercícios
              exerciseDefinitions: stateToSave.exerciseDefinitions,
              activeDayId: stateToSave.activeDayId,
            },
            lastSaved: new Date().toISOString(),
          };

          localStorage.setItem(
            WORKOUT_STATE_KEY,
            JSON.stringify(essentialData)
          );
          console.log("✅ Dados essenciais salvos após limpeza");
        } catch (cleanupError) {
          console.error("❌ Erro mesmo após limpeza:", cleanupError);
        }
      }
    }
  };

  // ✅ AUTO-SAVE quando estado muda (com debounce)
  useEffect(() => {
    // Não salvar na primeira carga
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      saveState(state);
    }, 2000); // Salvar após 2 segundos de inatividade

    return () => clearTimeout(timeoutId);
  }, [state]);

  // ✅ SALVAR antes de sair da página
  useEffect(() => {
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
  }, [state]);

  // ✅ SALVAR periodicamente (backup de segurança)
  useEffect(() => {
    const intervalId = setInterval(() => {
      saveState(state);
      console.log("🔄 Backup automático realizado");
    }, 5 * 60 * 1000); // A cada 5 minutos

    return () => clearInterval(intervalId);
  }, [state]);

  // ✅ Função helper para definir o dia ativo
  const setActiveDay = (dayId: string | null) => {
    dispatch({ type: "SET_ACTIVE_DAY", payload: dayId });
  };

  // ✅ FUNÇÃO para limpar todos os dados (útil para reset)
  const clearAllData = () => {
    try {
      localStorage.removeItem(WORKOUT_STATE_KEY);
      console.log("🗑️ Todos os dados foram limpos");
      window.location.reload(); // Recarregar para aplicar estado inicial
    } catch (error) {
      console.error("❌ Erro ao limpar dados:", error);
    }
  };

  // ✅ FUNÇÃO para exportar dados
  const exportData = () => {
    try {
      const exportData = {
        version: STATE_VERSION,
        exportDate: new Date().toISOString(),
        data: state,
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `gym-tracker-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      link.click();

      URL.revokeObjectURL(url);
      console.log("📥 Dados exportados com sucesso");
    } catch (error) {
      console.error("❌ Erro ao exportar dados:", error);
    }
  };

  // ✅ FUNÇÃO para importar dados
  const importData = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);

          // ✅ VALIDAR estrutura dos dados
          if (!importedData.data || !importedData.version) {
            console.error("❌ Arquivo de backup inválido");
            resolve(false);
            return;
          }

          // ✅ SALVAR dados importados
          const stateData = {
            version: STATE_VERSION,
            data: importedData.data,
            lastSaved: new Date().toISOString(),
            importedAt: new Date().toISOString(),
          };

          localStorage.setItem(WORKOUT_STATE_KEY, JSON.stringify(stateData));
          console.log("✅ Dados importados com sucesso");
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
    // ✅ ADICIONAR funções de persistência ao contexto (opcional)
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
