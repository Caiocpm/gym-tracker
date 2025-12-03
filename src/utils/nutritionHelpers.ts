// src/utils/nutritionHelpers.ts
import { AVAILABLE_MICRONUTRIENTS } from "../types/goals";

export const getMicronutrientUnit = (key: string): string => {
  const foundById = AVAILABLE_MICRONUTRIENTS.find((micro) => micro.id === key);
  if (foundById) {
    return foundById.unit;
  }

  const foundByName = AVAILABLE_MICRONUTRIENTS.find(
    (micro) => micro.name === key
  );
  if (foundByName) {
    return foundByName.unit;
  }

  const lowerKey = key.toLowerCase();

  if (
    lowerKey.includes("vitamin_a") ||
    lowerKey.includes("vitamin_d") ||
    lowerKey.includes("vitamin_b12") ||
    lowerKey.includes("cobalamina") ||
    lowerKey.includes("vitamina_b9") ||
    lowerKey.includes("ácido fólico") ||
    lowerKey.includes("biotina") ||
    lowerKey.includes("selenium") ||
    lowerKey.includes("selênio") ||
    lowerKey.includes("iodine") ||
    lowerKey.includes("iodo")
  ) {
    return "µg";
  }

  if (
    lowerKey.includes("calcium") ||
    lowerKey.includes("cálcio") ||
    lowerKey.includes("iron") ||
    lowerKey.includes("ferro") ||
    lowerKey.includes("magnesium") ||
    lowerKey.includes("magnésio") ||
    lowerKey.includes("potassium") ||
    lowerKey.includes("potássio") ||
    lowerKey.includes("sodium") ||
    lowerKey.includes("sódio") ||
    lowerKey.includes("phosphorus") ||
    lowerKey.includes("fósforo") ||
    lowerKey.includes("vitamin_c") ||
    lowerKey.includes("vitamina_c") ||
    lowerKey.includes("vitamin_e") ||
    lowerKey.includes("vitamina_e") ||
    lowerKey.includes("zinc") ||
    lowerKey.includes("zinco") ||
    lowerKey.includes("copper") ||
    lowerKey.includes("cobre")
  ) {
    return "mg";
  }

  return "mg";
};
