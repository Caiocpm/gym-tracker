// src/contexts/TimerToastProvider.tsx
import { useState } from "react";
import type { ReactNode } from "react";
import { TimerToastContext } from "./TimerToastContextDefinition";
import type {
  TimerToastData,
  TimerToastContextType,
} from "../types/timerToast";

interface TimerToastProviderProps {
  children: ReactNode;
}

export function TimerToastProvider({ children }: TimerToastProviderProps) {
  const [activeToast, setActiveToast] = useState<TimerToastData | null>(null);

  const showToast = (data: TimerToastData) => {
    setActiveToast(data);
  };

  const hideToast = () => {
    setActiveToast(null);
  };

  const updateToast = (updates: Partial<TimerToastData>) => {
    setActiveToast((prev) => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  };

  const contextValue: TimerToastContextType = {
    activeToast,
    showToast,
    hideToast,
    updateToast,
  };

  return (
    <TimerToastContext.Provider value={contextValue}>
      {children}
    </TimerToastContext.Provider>
  );
}
