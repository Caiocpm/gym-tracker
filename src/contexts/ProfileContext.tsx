/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from "react";
import type {
  ProfileState,
  ProfileAction,
  UserProfile,
  BodyMeasurements,
} from "../types/profile";

interface ProfileContextType {
  state: ProfileState;
  dispatch: React.Dispatch<ProfileAction>;
  updateProfile: (data: Partial<UserProfile>) => void;
  addMeasurement: (data: Omit<BodyMeasurements, "id" | "userId">) => void;
  updateMeasurement: (id: string, data: Partial<BodyMeasurements>) => void;
  deleteMeasurement: (id: string) => void;
  getLatestMeasurement: () => BodyMeasurements | null;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

const initialState: ProfileState = {
  profile: null,
  measurements: [],
  isLoading: false,
  error: null,
};

function profileReducer(
  state: ProfileState,
  action: ProfileAction
): ProfileState {
  switch (action.type) {
    case "SET_PROFILE":
      return { ...state, profile: action.payload };

    case "UPDATE_PROFILE":
      return {
        ...state,
        profile: state.profile
          ? {
              ...state.profile,
              ...action.payload,
              updatedAt: new Date().toISOString(),
            }
          : null,
      };

    case "ADD_MEASUREMENT":
      return {
        ...state,
        measurements: [...state.measurements, action.payload].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      };

    case "UPDATE_MEASUREMENT":
      return {
        ...state,
        measurements: state.measurements.map((measurement) =>
          measurement.id === action.payload.id
            ? { ...measurement, ...action.payload.data }
            : measurement
        ),
      };

    case "DELETE_MEASUREMENT":
      return {
        ...state,
        measurements: state.measurements.filter(
          (measurement) => measurement.id !== action.payload
        ),
      };

    case "LOAD_PROFILE_DATA":
      return action.payload;

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    default:
      return state;
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const loadInitialState = (): ProfileState => {
    try {
      const savedData = localStorage.getItem("gym-tracker-profile");
      if (savedData) {
        const parsed = JSON.parse(savedData);

        // Validar estrutura básica dos dados
        if (
          parsed &&
          typeof parsed === "object" &&
          "measurements" in parsed &&
          Array.isArray(parsed.measurements) &&
          "isLoading" in parsed &&
          typeof parsed.isLoading === "boolean"
        ) {
          return parsed as ProfileState;
        } else {
          return initialState;
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados do perfil:", error);
      // Em caso de erro (JSON corrompido, etc), retornar estado inicial
    }
    return initialState;
  };

  const [state, dispatch] = useReducer(
    profileReducer,
    undefined,
    loadInitialState
  );

  // Salvar no localStorage
  useEffect(() => {
    localStorage.setItem("gym-tracker-profile", JSON.stringify(state));
  }, [state]);

  const updateProfile = (data: Partial<UserProfile>) => {
    dispatch({ type: "UPDATE_PROFILE", payload: data });
  };

  const addMeasurement = (data: Omit<BodyMeasurements, "id" | "userId">) => {
    const newMeasurement: BodyMeasurements = {
      ...data,
      id: Date.now().toString(),
      userId: state.profile?.id || "default",
    };
    dispatch({ type: "ADD_MEASUREMENT", payload: newMeasurement });
  };

  const updateMeasurement = (id: string, data: Partial<BodyMeasurements>) => {
    dispatch({ type: "UPDATE_MEASUREMENT", payload: { id, data } });
  };

  const deleteMeasurement = (id: string) => {
    dispatch({ type: "DELETE_MEASUREMENT", payload: id });
  };

  const getLatestMeasurement = (): BodyMeasurements | null => {
    return state.measurements.length > 0 ? state.measurements[0] : null;
  };

  const value: ProfileContextType = {
    state,
    dispatch,
    updateProfile,
    addMeasurement,
    updateMeasurement,
    deleteMeasurement,
    getLatestMeasurement,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile deve ser usado dentro de ProfileProvider");
  }
  return context;
}

// Re-export do IndexedDB Provider para compatibilidade
export { ProfileProvider as ProfileProviderIndexedDB, useProfile as useProfileIndexedDB } from './ProfileProviderIndexedDB';
