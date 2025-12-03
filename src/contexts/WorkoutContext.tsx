// src/contexts/WorkoutContext.tsx
import { createContext, useContext } from "react";
import type {
  WorkoutState,
  WorkoutAction,
  WorkoutDay,
  CompletedExerciseInfo,
  LoggedExercise,
  ExerciseDefinition,
  WorkoutProgress,
  WorkoutSession,
} from "../types";
import { exerciseDefinitions } from "../data/exerciseDefinitions";

// ✅ Interface para o contexto ATUALIZADA
export interface WorkoutContextType {
  state: WorkoutState;
  dispatch: React.Dispatch<WorkoutAction>;
  setActiveDay: (dayId: string | null) => void;
  clearAllData?: () => void;
  exportData?: () => void;
  importData?: (file: File) => Promise<boolean>;
}

// ✅ EXPORTAR tipos
export type { WorkoutState } from "../types";
export type {
  WorkoutProgress,
  CompletedExerciseInfo,
  ExerciseProgress,
} from "../types";

// ✅ Criação do contexto
// eslint-disable-next-line react-refresh/only-export-components
export const WorkoutContext = createContext<WorkoutContextType | null>(null);

// ✅ Dados iniciais
const getInitialWorkoutDays = (): WorkoutDay[] => [
  {
    id: "workout-a",
    name: "Treino A - Peito e Tríceps",
    exercises: [
      {
        id: "ex-a1",
        exerciseDefinitionId: "supino-reto-barra",
        name: "Supino reto barra",
        plannedSets: 4,
        plannedReps: 10,
        plannedWeight: 80,
        notes: "Foco na técnica, controlar a descida",
        createdAt: new Date().toISOString(),
        plannedRestTime: 120,
        autoStartTimer: true,
        isStrengthTraining: true,
        useAdvancedMetrics: false,
      },
      {
        id: "ex-a2",
        exerciseDefinitionId: "supino-inclinado-halteres",
        name: "Supino inclinado halteres",
        plannedSets: 3,
        plannedReps: 12,
        plannedWeight: 70,
        notes: "Amplitude completa",
        createdAt: new Date().toISOString(),
        plannedRestTime: 90,
        autoStartTimer: true,
        isStrengthTraining: true,
        useAdvancedMetrics: true,
        rpe: 8,
      },
      {
        id: "ex-a3",
        exerciseDefinitionId: "dips-paralelas",
        name: "Dips paralelas",
        plannedSets: 3,
        plannedReps: 15,
        plannedWeight: 0,
        notes: "Peso corporal - se ficar fácil, adicionar peso",
        createdAt: new Date().toISOString(),
        plannedRestTime: 75,
        autoStartTimer: true,
        isStrengthTraining: true,
        useAdvancedMetrics: false,
      },
    ],
  },
  {
    id: "workout-b",
    name: "Treino B - Costas e Bíceps",
    exercises: [
      {
        id: "ex-b1",
        exerciseDefinitionId: "barra-fixa-pronada",
        name: "Barra fixa pronada",
        plannedSets: 4,
        plannedReps: 8,
        plannedWeight: 0,
        notes: "Peso corporal - foco na amplitude",
        createdAt: new Date().toISOString(),
        plannedRestTime: 120,
        autoStartTimer: true,
        isStrengthTraining: true,
        useAdvancedMetrics: true,
        rpe: 9,
      },
      {
        id: "ex-b2",
        exerciseDefinitionId: "remada-curvada-barra",
        name: "Remada curvada barra",
        plannedSets: 4,
        plannedReps: 10,
        plannedWeight: 60,
        notes: "Manter postura ereta, puxar até o abdômen",
        createdAt: new Date().toISOString(),
        plannedRestTime: 90,
        autoStartTimer: true,
        isStrengthTraining: true,
        useAdvancedMetrics: false,
      },
      {
        id: "ex-b3",
        exerciseDefinitionId: "rosca-direta-barra",
        name: "Rosca direta barra",
        plannedSets: 3,
        plannedReps: 12,
        plannedWeight: 20,
        notes: "Movimento controlado, sem balanço",
        createdAt: new Date().toISOString(),
        plannedRestTime: 60,
        autoStartTimer: true,
        isStrengthTraining: true,
        useAdvancedMetrics: false,
      },
    ],
  },
  {
    id: "workout-c",
    name: "Treino C - Pernas",
    exercises: [
      {
        id: "ex-c1",
        exerciseDefinitionId: "agachamento-livre",
        name: "Agachamento livre",
        plannedSets: 4,
        plannedReps: 12,
        plannedWeight: 100,
        notes: "Descer até 90 graus, manter joelhos alinhados",
        createdAt: new Date().toISOString(),
        plannedRestTime: 180,
        autoStartTimer: true,
        isStrengthTraining: true,
        useAdvancedMetrics: true,
        rpe: 8,
      },
      {
        id: "ex-c2",
        exerciseDefinitionId: "deadlift-convencional",
        name: "Deadlift convencional",
        plannedSets: 3,
        plannedReps: 8,
        plannedWeight: 120,
        notes: "Foco na técnica - costas reta, core ativado",
        createdAt: new Date().toISOString(),
        plannedRestTime: 180,
        autoStartTimer: true,
        isStrengthTraining: true,
        useAdvancedMetrics: true,
        rpe: 9,
      },
      {
        id: "ex-c3",
        exerciseDefinitionId: "leg-press",
        name: "Leg press",
        plannedSets: 3,
        plannedReps: 15,
        plannedWeight: 200,
        notes: "Amplitude completa, não travar os joelhos",
        createdAt: new Date().toISOString(),
        plannedRestTime: 120,
        autoStartTimer: true,
        isStrengthTraining: true,
        useAdvancedMetrics: false,
      },
    ],
  },
];

// eslint-disable-next-line react-refresh/only-export-components
export const initialState: WorkoutState = {
  workoutDays: getInitialWorkoutDays(),
  activeDayId: "workout-a",
  workoutSessions: [],
  loggedExercises: [],
  exerciseDefinitions: exerciseDefinitions,
  activeExecution: undefined,
  timerState: undefined,
  activeExercise: null,
  exerciseProgress: {},
  completedExercises: {},
  dismissedToasts: {}, // ✅ NOVO: Rastreamento de toasts descartados
};

// ✅ Reducer (mantém todas as ações existentes + novas)
// eslint-disable-next-line react-refresh/only-export-components
export const workoutReducer = (
  state: WorkoutState,
  action: WorkoutAction
): WorkoutState => {
  switch (action.type) {
    case "SET_ACTIVE_DAY":
      return {
        ...state,
        activeDayId: action.payload,
      };

    case "ADD_WORKOUT_SESSION":
      return {
        ...state,
        workoutSessions: [...state.workoutSessions, action.payload],
      };

    case "UPDATE_WORKOUT_SESSION":
      return {
        ...state,
        workoutSessions: state.workoutSessions.map((session) =>
          session.id === action.payload.id ? action.payload : session
        ),
      };

    case "DELETE_WORKOUT_SESSION":
      return {
        ...state,
        workoutSessions: state.workoutSessions.filter(
          (session) => session.id !== action.payload
        ),
      };

    case "LOG_EXERCISE": {
      // Adicionar exercício em loggedExercises
      const newLoggedExercises = [...state.loggedExercises, action.payload];

      // Também adicionar/atualizar na sessão correspondente
      const today = new Date().toISOString().split("T")[0];
      const sessionIndex = state.workoutSessions.findIndex((session) => {
        const sessionDate = session.date.split("T")[0];
        return sessionDate === today && session.dayId === action.payload.dayId;
      });

      let updatedSessions = [...state.workoutSessions];

      if (sessionIndex >= 0) {
        // Atualizar sessão existente
        const session = updatedSessions[sessionIndex];
        const sessionExercises = [...(session.exercises || [])];

        // Verificar se já existe um exercício com o mesmo exerciseDefinitionId
        const existingExerciseIndex = sessionExercises.findIndex(
          (ex) =>
            ex.exerciseDefinitionId === action.payload.exerciseDefinitionId
        );

        if (existingExerciseIndex >= 0) {
          // Atualizar exercício existente
          sessionExercises[existingExerciseIndex] = action.payload;
        } else {
          // Adicionar novo exercício
          sessionExercises.push(action.payload);
        }

        updatedSessions[sessionIndex] = {
          ...session,
          exercises: sessionExercises,
        };
      } else {
        // ✅ Criar nova sessão se não existir
        const newSession = {
          id: `session-${Date.now()}`,
          dayId: action.payload.dayId,
          workoutDayId: action.payload.dayId,
          date: new Date().toISOString(),
          startTime: new Date().toISOString(),
          exercises: [action.payload],
          notes: "",
        };
        updatedSessions = [...updatedSessions, newSession];
        console.log("✅ Nova sessão criada:", newSession);
      }

      return {
        ...state,
        loggedExercises: newLoggedExercises,
        workoutSessions: updatedSessions,
      };
    }

    case "UPDATE_LOGGED_EXERCISE":
      return {
        ...state,
        loggedExercises: state.loggedExercises.map((exercise) =>
          exercise.id === action.payload.id ? action.payload : exercise
        ),
      };

    case "DELETE_LOGGED_EXERCISE":
      return {
        ...state,
        loggedExercises: state.loggedExercises.filter(
          (exercise) => exercise.id !== action.payload
        ),
      };

    case "ADD_WORKOUT_DAY":
      return {
        ...state,
        workoutDays: [...state.workoutDays, action.payload],
      };

    case "UPDATE_WORKOUT_DAY":
      return {
        ...state,
        workoutDays: state.workoutDays.map((day) =>
          day.id === action.payload.id ? action.payload : day
        ),
      };

    case "DELETE_WORKOUT_DAY":
      return {
        ...state,
        workoutDays: state.workoutDays.filter(
          (day) => day.id !== action.payload
        ),
        activeDayId:
          state.activeDayId === action.payload
            ? state.workoutDays.find((day) => day.id !== action.payload)?.id ||
              null
            : state.activeDayId,
      };

    case "ADD_PLANNED_EXERCISE":
      return {
        ...state,
        workoutDays: state.workoutDays.map((day) =>
          day.id === action.payload.dayId
            ? {
                ...day,
                exercises: [...day.exercises, action.payload.exercise],
              }
            : day
        ),
      };

    case "UPDATE_PLANNED_EXERCISE":
      return {
        ...state,
        workoutDays: state.workoutDays.map((day) =>
          day.id === action.payload.dayId
            ? {
                ...day,
                exercises: day.exercises.map((exercise) =>
                  exercise.id === action.payload.exerciseId
                    ? action.payload.exercise
                    : exercise
                ),
              }
            : day
        ),
      };

    case "DELETE_PLANNED_EXERCISE":
      return {
        ...state,
        workoutDays: state.workoutDays.map((day) =>
          day.id === action.payload.dayId
            ? {
                ...day,
                exercises: day.exercises.filter(
                  (exercise) => exercise.id !== action.payload.exerciseId
                ),
              }
            : day
        ),
      };

    case "ADD_EXERCISE_DEFINITION":
      return {
        ...state,
        exerciseDefinitions: [...state.exerciseDefinitions, action.payload],
      };

    case "UPDATE_EXERCISE_DEFINITION":
      return {
        ...state,
        exerciseDefinitions: state.exerciseDefinitions.map((def) =>
          def.id === action.payload.id ? action.payload : def
        ),
      };

    case "DELETE_EXERCISE_DEFINITION":
      return {
        ...state,
        exerciseDefinitions: state.exerciseDefinitions.filter(
          (def) => def.id !== action.payload
        ),
      };

    case "LOAD_DATA":
      return {
        ...action.payload,
        activeExecution: undefined,
        timerState: undefined,
        activeExercise: null,
      };

    case "START_EXERCISE_EXECUTION":
      return {
        ...state,
        activeExecution: action.payload,
      };

    case "UPDATE_EXERCISE_EXECUTION":
      return {
        ...state,
        activeExecution: action.payload,
      };

    case "COMPLETE_EXERCISE_EXECUTION":
      return {
        ...state,
        activeExecution: undefined,
        loggedExercises: [...state.loggedExercises, action.payload],
      };

    case "CANCEL_EXERCISE_EXECUTION":
      return {
        ...state,
        activeExecution: undefined,
      };

    case "SET_ACTIVE_EXERCISE":
      return {
        ...state,
        activeExercise: action.payload,
      };

    case "SAVE_EXERCISE_PROGRESS":
      return {
        ...state,
        exerciseProgress: {
          ...state.exerciseProgress,
          [action.payload.exerciseId]: {
            execution: action.payload.execution,
            currentSetData: action.payload.currentSetData,
          },
        },
      };

    case "CLEAR_EXERCISE_PROGRESS": {
      const remainingProgress = Object.fromEntries(
        Object.entries(state.exerciseProgress).filter(
          ([key]) => key !== action.payload
        )
      );
      return {
        ...state,
        exerciseProgress: remainingProgress,
      };
    }

    case "MARK_EXERCISE_COMPLETED":
      return {
        ...state,
        completedExercises: {
          ...state.completedExercises,
          [action.payload.exerciseId]: {
            exerciseId: action.payload.exerciseId,
            loggedExercise: action.payload.loggedExercise,
            completedAt: new Date().toISOString(),
          },
        },
      };

    case "CLEAR_COMPLETED_EXERCISE": {
      const remainingCompleted = Object.fromEntries(
        Object.entries(state.completedExercises).filter(
          ([key]) => key !== action.payload
        )
      );
      return {
        ...state,
        completedExercises: remainingCompleted,
      };
    }

    // ✅ NOVO: Descartar toast para um dia específico
    case "DISMISS_TOAST":
      return {
        ...state,
        dismissedToasts: {
          ...state.dismissedToasts,
          [action.payload]: true,
        },
      };

    // ✅ NOVO: Resetar toast para permitir compartilhar novamente
    case "RESET_TOAST":
      return {
        ...state,
        dismissedToasts: {
          ...state.dismissedToasts,
          [action.payload]: false,
        },
      };

    default:
      return state;
  }
};

// eslint-disable-next-line react-refresh/only-export-components
export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error("useWorkout deve ser usado dentro de um WorkoutProvider");
  }
  return context;
}

// Re-export do IndexedDB Provider para compatibilidade
export { WorkoutProvider as WorkoutProviderIndexedDB } from "./WorkoutProviderIndexedDB";

// ✅ FUNÇÕES UTILITÁRIAS
// eslint-disable-next-line react-refresh/only-export-components
export function validateWorkoutData(data: Record<string, unknown>): boolean {
  try {
    if (!data || typeof data !== "object") return false;

    const requiredFields = [
      "workoutDays",
      "loggedExercises",
      "exerciseDefinitions",
    ];
    const hasRequiredFields = requiredFields.every(
      (field) =>
        Object.prototype.hasOwnProperty.call(data, field) &&
        Array.isArray(data[field])
    );

    if (!hasRequiredFields) return false;

    if (Array.isArray(data.workoutDays) && data.workoutDays.length > 0) {
      const firstDay = data.workoutDays[0] as Record<string, unknown>;
      if (
        !firstDay.id ||
        !firstDay.name ||
        !Array.isArray(firstDay.exercises)
      ) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Erro na validação dos dados:", error);
    return false;
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function migrateWorkoutData(
  data: Record<string, unknown>,
  version?: string
): WorkoutState {
  try {
    if (version === "1.0" && data.data) {
      const oldData = data.data as Record<string, unknown>;
      return {
        workoutDays: (oldData.workoutDays as WorkoutDay[]) || [],
        activeDayId: (oldData.activeDay as string) || "workout-a",
        loggedExercises: (oldData.exerciseHistory as LoggedExercise[]) || [],
        workoutSessions: [],
        exerciseDefinitions:
          (oldData.exerciseDefinitions as ExerciseDefinition[]) ||
          exerciseDefinitions,
        activeExecution: undefined,
        timerState: undefined,
        activeExercise: null,
        exerciseProgress: {},
        completedExercises: {},
        dismissedToasts: {}, // ✅ NOVO
      };
    }

    if (data.workout) {
      const workoutData = data.workout as Record<string, unknown>;
      return {
        ...initialState,
        ...workoutData,
        workoutDays: (workoutData.workoutDays as WorkoutDay[]) || [],
        loggedExercises:
          (workoutData.loggedExercises as LoggedExercise[]) || [],
        workoutSessions:
          (workoutData.workoutSessions as WorkoutSession[]) || [],
        exerciseDefinitions:
          (workoutData.exerciseDefinitions as ExerciseDefinition[]) ||
          exerciseDefinitions,
        exerciseProgress:
          (workoutData.exerciseProgress as WorkoutProgress) || {},
        completedExercises:
          (workoutData.completedExercises as Record<
            string,
            CompletedExerciseInfo
          >) || {},
        dismissedToasts:
          (workoutData.dismissedToasts as Record<string, boolean>) || {}, // ✅ NOVO
        activeExecution: undefined,
        timerState: undefined,
        activeExercise: null,
      };
    }

    return {
      ...initialState,
      ...data,
      activeExecution: undefined,
      timerState: undefined,
      activeExercise: null,
    } as WorkoutState;
  } catch (error) {
    console.error("Erro na migração dos dados:", error);
    return initialState;
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function sanitizeWorkoutData(
  state: WorkoutState
): Partial<WorkoutState> {
  return {
    workoutDays: state.workoutDays,
    activeDayId: state.activeDayId,
    workoutSessions: state.workoutSessions,
    loggedExercises: state.loggedExercises,
    exerciseDefinitions: state.exerciseDefinitions,
    exerciseProgress: state.exerciseProgress,
    completedExercises: state.completedExercises,
    dismissedToasts: state.dismissedToasts, // ✅ NOVO
  };
}
