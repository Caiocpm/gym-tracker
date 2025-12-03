// src/components/GlobalTimerToast/GlobalTimerToast.tsx
import { useTimerToast } from "../../hooks/useTimerToast";
import { TimerToast } from "../WorkoutTracker/TimerToast/TimerToast";

export function GlobalTimerToast() {
  const { activeToast, hideToast } = useTimerToast();

  // ✅ REMOVER TODA a lógica de auto-cancelamento
  // O toast só deve ser cancelado quando:
  // 1. O timer completar naturalmente
  // 2. O usuário clicar em "pular"
  // 3. O usuário explicitamente cancelar

  console.log("🔍 GlobalTimerToast render:", {
    hasActiveToast: !!activeToast,
    exerciseName: activeToast?.exerciseName,
  });

  if (!activeToast) {
    return null;
  }

  return (
    <TimerToast
      exerciseName={activeToast.exerciseName}
      currentSet={activeToast.currentSet}
      totalSets={activeToast.totalSets}
      restTime={activeToast.restTime}
      onComplete={() => {
        console.log("✅ Timer completado - escondendo toast");
        activeToast.onComplete();
        hideToast();
      }}
      onReturnToExecution={() => {
        console.log("🔄 Navegando para exercício - toast permanece ativo");
        activeToast.onReturnToExecution();
      }}
    />
  );
}
