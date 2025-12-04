// src/components/WorkoutTracker/TimerToast/TimerToast.tsx
import { useEffect, useState, useRef } from "react";
import styles from "./TimerToast.module.css";

interface TimerToastProps {
  exerciseName: string;
  currentSet: number;
  totalSets: number;
  restTime: number;
  onComplete: () => void;
  onReturnToExecution: () => void;
}

export function TimerToast({
  exerciseName,
  currentSet,
  totalSets,
  restTime,
  onComplete,
  onReturnToExecution,
}: TimerToastProps) {
  const [timeRemaining, setTimeRemaining] = useState(restTime);
  const [isRunning, setIsRunning] = useState(true);
  const [transform, setTransform] = useState("translateY(0px)");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompletedRef = useRef(false);
  const toastRef = useRef<HTMLDivElement>(null);

  // ✅ EFEITO para gerenciar o timer
  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (timeRemaining <= 0 && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        console.log("⏰ Timer completado - chamando onComplete");
        onComplete();
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setIsRunning(false);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, timeRemaining, onComplete]);

  // ✅ EFEITO para acompanhar scroll com transform
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setTransform(`translateY(${scrollY}px)`);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ CLEANUP quando componente desmonta
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ✅ Função de navegação simples
  const handleNavigateToExercise = (e: React.MouseEvent) => {
    // Verificar se não foi clique no botão de skip
    if ((e.target as HTMLElement).closest(`.${styles.compactSkip}`)) {
      return;
    }

    console.log("🔄 Navegando para exercício - timer continua rodando");
    onReturnToExecution();
  };

  // ✅ Função para pular
  const handleSkipRest = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log("⏭️ Pulando descanso - cancelando timer");
    setIsRunning(false);
    hasCompletedRef.current = true;
    onComplete();
  };

  return (
    <div
      ref={toastRef}
      className={styles.compactToast}
      style={{
        transform: transform,
      }}
      onClick={handleNavigateToExercise}
      title={`${exerciseName} - Série ${currentSet} de ${totalSets} - Clique para voltar`}
      data-warning={timeRemaining <= 10 ? "true" : "false"}
    >
      <div className={styles.compactContent}>
        <div className={styles.compactTimer}>
          ⏱️ {formatTime(timeRemaining)}
        </div>
        <div className={styles.compactInfo}>
          <div className={styles.compactExercise}>{exerciseName}</div>
          <div className={styles.compactSet}>
            {currentSet}/{totalSets}
          </div>
        </div>
        <button
          className={styles.compactSkip}
          onClick={handleSkipRest}
          title="Pular descanso"
          type="button"
        >
          ⏭️
        </button>
      </div>
    </div>
  );
}
