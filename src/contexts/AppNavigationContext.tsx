// src/contexts/AppNavigationContext.tsx
import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

// Define os tipos possíveis para as views da aplicação
export type AppView =
  | "dashboard"
  | "workout"
  | "nutrition"
  | "analytics"
  | "profile"
  | "groups"
  | "settings";

// Define a interface para o valor do contexto
interface AppNavigationContextType {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  forceNavigateToWorkout: () => void;
}

// Cria o contexto com um valor inicial indefinido
const AppNavigationContext = createContext<
  AppNavigationContextType | undefined
>(undefined);

// Provedor do contexto de navegação da aplicação
export function AppNavigationProvider({ children }: { children: ReactNode }) {
  const [activeView, setActiveView] = useState<AppView>("workout");

  // Função para definir a view ativa, memoizada com useCallback
  const setView = useCallback((view: AppView) => {
    setActiveView(view);
  }, []);

  // ✅ Função específica para forçar navegação para treinos
  const forceNavigateToWorkout = useCallback(() => {
    setActiveView("workout");
  }, []);

  const contextValue: AppNavigationContextType = {
    activeView,
    setActiveView: setView,
    forceNavigateToWorkout,
  };

  return (
    <AppNavigationContext.Provider value={contextValue}>
      {children}
    </AppNavigationContext.Provider>
  );
}

// Hook personalizado para consumir o contexto de navegação
// eslint-disable-next-line react-refresh/only-export-components
export function useAppNavigation() {
  const context = useContext(AppNavigationContext);
  if (context === undefined) {
    throw new Error(
      "useAppNavigation must be used within an AppNavigationProvider"
    );
  }
  return context;
}
