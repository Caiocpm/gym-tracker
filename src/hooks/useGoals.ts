// src/hooks/useGoals.ts
import { useState, useEffect, useCallback } from "react";
import type { UserGoals } from "../types/goals";
import { DEFAULT_GOALS } from "../types/goals";

const STORAGE_KEY = "nutrition_goals";

export const useGoals = () => {
  // ✅ INICIALIZAR COM FUNÇÃO LAZY PARA EVITAR RENDERIZAÇÕES DESNECESSÁRIAS
  const [currentGoals, setCurrentGoals] = useState<UserGoals>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedGoals = JSON.parse(stored);
        return parsedGoals;
      } else {
        return DEFAULT_GOALS;
      }
    } catch (error) {
      console.error("❌ Erro ao carregar metas (inicialização):", error);
      return DEFAULT_GOALS;
    }
  });

  // ✅ FUNÇÃO MEMOIZADA PARA ATUALIZAR METAS
  const updateGoals = useCallback((newGoals: UserGoals) => {
    try {
      setCurrentGoals(newGoals);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newGoals));

      // ✅ DISPARAR EVENTO PERSONALIZADO PARA NOTIFICAR OUTROS COMPONENTES
      window.dispatchEvent(
        new CustomEvent("goalsUpdated", {
          detail: newGoals,
        })
      );
    } catch (error) {
      console.error("❌ Erro ao salvar metas:", error);
    }
  }, []);

  // ✅ FUNÇÃO MEMOIZADA PARA RESETAR METAS
  const resetGoals = useCallback(() => {
    setCurrentGoals(DEFAULT_GOALS);
    localStorage.removeItem(STORAGE_KEY);

    // ✅ DISPARAR EVENTO PARA RESET
    window.dispatchEvent(
      new CustomEvent("goalsUpdated", {
        detail: DEFAULT_GOALS,
      })
    );
  }, []);

  // ✅ EFFECT APENAS PARA ESCUTAR MUDANÇAS EXTERNAS (SE NECESSÁRIO)
  useEffect(() => {
    // ✅ ESCUTAR MUDANÇAS NO LOCALSTORAGE DE OUTRAS ABAS/JANELAS
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newGoals = JSON.parse(e.newValue);
          setCurrentGoals(newGoals);
        } catch (error) {
          console.error("❌ Erro ao sincronizar metas de outra aba:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return {
    currentGoals,
    updateGoals,
    resetGoals,
  };
};
