// src/contexts/NutritionContext.ts
import { createContext, useContext } from "react";
import type { NutritionContextType } from "../types/nutrition";

export const NutritionContext = createContext<NutritionContextType | undefined>(
  undefined
);

export function useNutrition() {
  const context = useContext(NutritionContext);
  if (context === undefined) {
    throw new Error("useNutrition must be used within a NutritionProvider");
  }
  return context;
}
