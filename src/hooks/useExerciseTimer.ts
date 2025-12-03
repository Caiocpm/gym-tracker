// src/hooks/useExerciseTimer.ts
import { useState, useEffect, useCallback, useRef } from "react";

interface UseExerciseTimerProps {
  initialTime: number;
  autoStart?: boolean;
  onComplete?: () => void;
  onTick?: (timeRemaining: number) => void;
}

// ✅ Exportar interface para uso em outros componentes
export interface UseExerciseTimerReturn {
  timeRemaining: number;
  isActive: boolean;
  isPaused: boolean;
  progress: number;
  formattedTime: string;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: (newTime?: number) => void;
  addTime: (seconds: number) => void;
  stop: () => void;
}

export const useExerciseTimer = ({
  initialTime,
  autoStart = false,
  onComplete,
  onTick,
}: UseExerciseTimerProps): UseExerciseTimerReturn => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isActive, setIsActive] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  const [totalTime, setTotalTime] = useState(initialTime);
  // ✅ Corrigir tipo do timer
  const intervalRef = useRef<number | null>(null);

  // Formatar tempo em MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  // Calcular progresso (0-1)
  const progress = totalTime > 0 ? (totalTime - timeRemaining) / totalTime : 0;

  // Efeito principal do timer
  useEffect(() => {
    if (isActive && !isPaused && timeRemaining > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          onTick?.(newTime);

          if (newTime <= 0) {
            setIsActive(false);
            onComplete?.();
            return 0;
          }

          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, timeRemaining, onComplete, onTick]);

  // Funções de controle
  const start = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const reset = useCallback(
    (newTime?: number) => {
      const resetTime = newTime || initialTime;
      setTimeRemaining(resetTime);
      setTotalTime(resetTime);
      setIsActive(false);
      setIsPaused(false);
    },
    [initialTime]
  );

  const addTime = useCallback((seconds: number) => {
    setTimeRemaining((prev) => Math.max(0, prev + seconds));
    setTotalTime((prev) => prev + seconds);
  }, []);

  const stop = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    setTimeRemaining(initialTime);
    setTotalTime(initialTime);
  }, [initialTime]);

  return {
    timeRemaining,
    isActive,
    isPaused,
    progress,
    formattedTime: formatTime(timeRemaining),
    start,
    pause,
    resume,
    reset,
    addTime,
    stop,
  };
};
