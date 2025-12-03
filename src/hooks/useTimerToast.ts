// src/hooks/useTimerToast.ts
import { useContext } from "react";
import { TimerToastContext } from "../contexts/TimerToastContextDefinition";

export function useTimerToast() {
  const context = useContext(TimerToastContext);
  if (!context) {
    throw new Error("useTimerToast must be used within TimerToastProvider");
  }
  return context;
}
