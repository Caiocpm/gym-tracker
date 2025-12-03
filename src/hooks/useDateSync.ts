import { useEffect, useRef } from "react";
import { useNutritionContext } from "./useNutritionContext";

export const useDateSync = () => {
  const { state, setSelectedDate } = useNutritionContext();
  const intervalRef = useRef<number | null>(null); // ✅ MUDANÇA: number ao invés de NodeJS.Timeout
  const midnightTimeoutRef = useRef<number | null>(null); // ✅ MUDANÇA: number ao invés de NodeJS.Timeout

  useEffect(() => {
    const checkDateChange = () => {
      const today = new Date().toISOString().split("T")[0];

      if (state.selectedDate !== today) {
        setSelectedDate(today);

        // Disparar evento customizado para notificação
        window.dispatchEvent(
          new CustomEvent("dateChanged", {
            detail: { oldDate: state.selectedDate, newDate: today },
          })
        );
      }
    };

    // ✅ NOVA FUNÇÃO: Calcular tempo até a próxima meia-noite
    const scheduleNextMidnightCheck = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const msUntilMidnight = tomorrow.getTime() - now.getTime();

      // Limpar timeout anterior
      if (midnightTimeoutRef.current) {
        clearTimeout(midnightTimeoutRef.current);
      }

      // Agendar verificação exata na meia-noite (+ 1 segundo para garantir)
      midnightTimeoutRef.current = window.setTimeout(() => {
        // ✅ MUDANÇA: window.setTimeout
        checkDateChange();
        scheduleNextMidnightCheck(); // Agendar próxima meia-noite
      }, msUntilMidnight + 1000);
    };

    const startInterval = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(checkDateChange, 60000); // ✅ MUDANÇA: window.setInterval
    };

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const stopMidnightTimeout = () => {
      if (midnightTimeoutRef.current) {
        clearTimeout(midnightTimeoutRef.current);
        midnightTimeoutRef.current = null;
      }
    };

    // Verificar imediatamente
    checkDateChange();

    // Iniciar intervalo de backup
    startInterval();

    // ✅ NOVO: Agendar verificação precisa da meia-noite
    scheduleNextMidnightCheck();

    // Otimização: Pausar quando a aba não está ativa
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopInterval();
        stopMidnightTimeout();
      } else {
        checkDateChange();
        startInterval();
        scheduleNextMidnightCheck();
      }
    };

    // Verificar quando a janela ganha foco
    const handleFocus = () => {
      checkDateChange();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      stopInterval();
      stopMidnightTimeout();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [state.selectedDate, setSelectedDate]);
};
