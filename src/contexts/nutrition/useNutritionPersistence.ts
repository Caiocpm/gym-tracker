// Nutrition Persistence Hook
import { useEffect, useRef } from "react";
import type { NutritionState } from "../../types/nutrition";

interface UseNutritionPersistenceProps {
  state: NutritionState;
  isInitialized: boolean;
  onWarning: (message: string) => void;
}

export function useNutritionPersistence({
  state,
  isInitialized,
  onWarning,
}: UseNutritionPersistenceProps) {
  const lastSavedState = useRef<string>("");

  useEffect(() => {
    if (!isInitialized) return;

    const stateString = JSON.stringify(state);

    if (lastSavedState.current !== stateString) {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const cleanedState = {
          ...state,
          foodEntries: state.foodEntries.filter((entry) => {
            const entryDate = new Date(entry.date);
            return entryDate >= thirtyDaysAgo;
          }),
          waterEntries: state.waterEntries.filter((entry) => {
            const entryDate = new Date(entry.date);
            return entryDate >= thirtyDaysAgo;
          }),
        };

        const cleanedStateString = JSON.stringify(cleanedState);
        const sizeInBytes = new Blob([cleanedStateString]).size;

        if (sizeInBytes > 5 * 1024 * 1024) {
          onWarning(
            "⚠️ Armazenamento cheio! Dados antigos (mais de 7 dias) serão removidos para liberar espaço."
          );

          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const aggressiveCleanedState = {
            ...state,
            foodEntries: state.foodEntries.filter((entry) => {
              const entryDate = new Date(entry.date);
              return entryDate >= sevenDaysAgo;
            }),
            waterEntries: state.waterEntries.filter((entry) => {
              const entryDate = new Date(entry.date);
              return entryDate >= sevenDaysAgo;
            }),
          };

          localStorage.setItem(
            "nutrition-data",
            JSON.stringify(aggressiveCleanedState)
          );
          lastSavedState.current = JSON.stringify(aggressiveCleanedState);
        } else {
          localStorage.setItem("nutrition-data", cleanedStateString);
          lastSavedState.current = cleanedStateString;
        }
      } catch (error) {
        if (error instanceof Error && error.name === "QuotaExceededError") {
          localStorage.removeItem("nutrition-data");

          const essentialState = {
            ...state,
            foodEntries: state.foodEntries.filter(
              (entry) => entry.date === state.selectedDate
            ),
            waterEntries: state.waterEntries.filter(
              (entry) => entry.date === state.selectedDate
            ),
          };

          try {
            localStorage.setItem(
              "nutrition-data",
              JSON.stringify(essentialState)
            );
          } catch (retryError) {
            console.error("Falha ao salvar dados essenciais");
          }
        }
      }
    }
  }, [state, isInitialized, onWarning]);
}
