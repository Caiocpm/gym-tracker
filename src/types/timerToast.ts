// src/types/timerToast.ts
export interface TimerToastData {
  id: string;
  exerciseName: string;
  currentSet: number;
  totalSets: number;
  restTime: number;
  startTime: number; // timestamp quando iniciou
  onComplete: () => void;
  onReturnToExecution: () => void;
}

export interface TimerToastContextType {
  activeToast: TimerToastData | null;
  showToast: (data: TimerToastData) => void;
  hideToast: () => void;
  updateToast: (updates: Partial<TimerToastData>) => void;
}
