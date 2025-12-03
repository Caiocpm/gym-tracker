// Nutrition Calculations Hook
import { useCallback } from "react";
import type {
  NutritionState,
  FoodEntry,
  WaterEntry,
  EntryStatus,
  MealType,
  MealPlanningStats,
  DailyPlanningOverview,
} from "../../types/nutrition";

export function useNutritionCalculations(state: NutritionState) {
  const getEntriesByStatus = useCallback(
    (status: EntryStatus, date?: string): FoodEntry[] => {
      const targetDate = date || state.selectedDate;
      const entriesForDate = state.foodEntries.filter(
        (entry) => entry.date === targetDate
      );

      if (status === "all") return entriesForDate;

      return entriesForDate.filter((entry) => entry.status === status);
    },
    [state.foodEntries, state.selectedDate]
  );

  const getWaterByStatus = useCallback(
    (status: EntryStatus, date?: string): WaterEntry[] => {
      const targetDate = date || state.selectedDate;
      const entriesForDate = state.waterEntries.filter(
        (entry) => entry.date === targetDate
      );

      if (status === "all") return entriesForDate;
      return entriesForDate.filter((entry) => entry.status === status);
    },
    [state.waterEntries, state.selectedDate]
  );

  const getMealPlanningStats = useCallback(
    (meal: MealType, date?: string): MealPlanningStats => {
      const targetDate = date || state.selectedDate;
      const mealEntries = state.foodEntries.filter(
        (entry) => entry.date === targetDate && entry.meal === meal
      );

      const plannedEntries = mealEntries.filter(
        (entry) => entry.status === "planned"
      );
      const consumedEntries = mealEntries.filter(
        (entry) => entry.status === "consumed"
      );

      const plannedCalories = plannedEntries.reduce(
        (sum, entry) => sum + entry.calories,
        0
      );
      const consumedCalories = consumedEntries.reduce(
        (sum, entry) => sum + entry.calories,
        0
      );

      const totalItems = plannedEntries.length + consumedEntries.length;
      const completionPercentage =
        totalItems > 0
          ? Math.round((consumedEntries.length / totalItems) * 100)
          : 0;

      return {
        meal,
        plannedItems: plannedEntries.length,
        consumedItems: consumedEntries.length,
        plannedCalories,
        consumedCalories,
        completionPercentage,
      };
    },
    [state.foodEntries, state.selectedDate]
  );

  const getDailyPlanningOverview = useCallback(
    (date?: string): DailyPlanningOverview => {
      const targetDate = date || state.selectedDate;

      const foodEntries = state.foodEntries.filter(
        (entry) => entry.date === targetDate
      );
      const waterEntries = state.waterEntries.filter(
        (entry) => entry.date === targetDate
      );

      const plannedFoodEntries = foodEntries.filter(
        (entry) => entry.status === "planned"
      );
      const consumedFoodEntries = foodEntries.filter(
        (entry) => entry.status === "consumed"
      );
      const plannedWaterEntries = waterEntries.filter(
        (entry) => entry.status === "planned"
      );
      const consumedWaterEntries = waterEntries.filter(
        (entry) => entry.status === "consumed"
      );

      const totalPlannedFood = plannedFoodEntries.reduce(
        (acc, entry) => ({
          calories: acc.calories + entry.calories,
          protein: acc.protein + entry.protein,
          carbs: acc.carbs + entry.carbs,
          fat: acc.fat + entry.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      const totalConsumedFood = consumedFoodEntries.reduce(
        (acc, entry) => ({
          calories: acc.calories + entry.calories,
          protein: acc.protein + entry.protein,
          carbs: acc.carbs + entry.carbs,
          fat: acc.fat + entry.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      const totalPlannedWater = plannedWaterEntries.reduce(
        (sum, entry) => sum + entry.amount,
        0
      );
      const totalConsumedWater = consumedWaterEntries.reduce(
        (sum, entry) => sum + entry.amount,
        0
      );

      const totalWaterItems =
        plannedWaterEntries.length + consumedWaterEntries.length;
      const waterCompletionPercentage =
        totalWaterItems > 0
          ? Math.round((consumedWaterEntries.length / totalWaterItems) * 100)
          : 0;

      const totalPlannedItems =
        plannedFoodEntries.length + plannedWaterEntries.length;
      const totalConsumedItems =
        consumedFoodEntries.length + consumedWaterEntries.length;

      const overallCompletionPercentage =
        totalPlannedItems > 0
          ? Math.round((totalConsumedItems / totalPlannedItems) * 100)
          : 0;

      return {
        date: targetDate,
        totalPlannedItems,
        totalConsumedItems,
        totalPlannedCalories: totalPlannedFood.calories,
        totalConsumedCalories: totalConsumedFood.calories,
        overallCompletionPercentage,
        mealStats: [],
        waterStats: {
          plannedAmount: totalPlannedWater,
          consumedAmount: totalConsumedWater,
          completionPercentage: waterCompletionPercentage,
        },
      };
    },
    [state.foodEntries, state.waterEntries, state.selectedDate]
  );

  return {
    getEntriesByStatus,
    getWaterByStatus,
    getMealPlanningStats,
    getDailyPlanningOverview,
  };
}
