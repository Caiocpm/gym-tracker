// src/hooks/useNutritionContext.ts
import { useContext } from "react";
import { NutritionContext } from "../contexts/NutritionContext"; // Importa o contexto do arquivo separado
import type { NutritionContextType } from "../types/nutrition"; // Importa o tipo do arquivo de tipos

export function useNutritionContext(): NutritionContextType {
  const context = useContext(NutritionContext);
  if (context === undefined) {
    throw new Error(
      "useNutritionContext must be used within a NutritionProvider"
    );
  }
  return context;
}
