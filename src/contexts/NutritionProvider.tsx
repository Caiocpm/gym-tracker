// Nutrition Provider
import {
  useReducer,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { NutritionContext } from "./NutritionContext";
import { useNutritionHistory } from "../hooks/useNutritionHistory";
import { useToast } from "../hooks/useToast";
import { nutritionReducer, initialState } from "./nutrition/nutritionReducer";
import { useNutritionPersistence } from "./nutrition/useNutritionPersistence";
import { useNutritionCalculations } from "./nutrition/useNutritionCalculations";
import type {
  FoodEntry,
  WaterEntry,
  DailyGoals,
  DailySummaryRecord,
} from "../types/nutrition";

export function NutritionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(nutritionReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);
  const lastSavedRecord = useRef<string>("");
  const { addToast } = useToast();

  const {
    getDailySummaryRecord,
    updateDailySummaryRecord,
    createMealPlan,
    setActiveMealPlan,
    getActiveMealPlan,
    addFoodToMealPlanTemplate,
    removeFoodFromMealPlanTemplate,
    getHistoryStats,
    getAchievements,
    activeMealPlanId,
    mealPlans,
    streaks,
    isLoading: isHistoryLoading,
  } = useNutritionHistory();

  const activeMealPlan = getActiveMealPlan();

  // === Load Initial Data ===
  useEffect(() => {
    if (isHistoryLoading || isInitialized) return;

    const savedData = localStorage.getItem("nutrition-data");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);

        if (
          !parsedData ||
          typeof parsedData !== "object" ||
          !Array.isArray(parsedData.foodEntries) ||
          !Array.isArray(parsedData.waterEntries)
        ) {
          return;
        }

        const needsMigration =
          parsedData.foodEntries?.some((entry: FoodEntry) => !entry.status) ||
          parsedData.waterEntries?.some((entry: WaterEntry) => !entry.status);

        if (needsMigration) {
          const migratedData = {
            ...parsedData,
            foodEntries:
              parsedData.foodEntries?.map((entry: FoodEntry) => ({
                ...entry,
                status: entry.status || "consumed",
                plannedAt:
                  entry.plannedAt || entry.time || new Date().toISOString(),
              })) || [],
            waterEntries:
              parsedData.waterEntries?.map((entry: WaterEntry) => ({
                ...entry,
                status: entry.status || "consumed",
                plannedAt:
                  entry.plannedAt || entry.time || new Date().toISOString(),
              })) || [],
          };
          dispatch({ type: "LOAD_NUTRITION_DATA", payload: migratedData });
        } else {
          dispatch({ type: "LOAD_NUTRITION_DATA", payload: parsedData });
        }
      } catch {
        console.error("Erro ao carregar dados do localStorage");
      }
    }

    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 0);

    return () => clearTimeout(timer);
  }, [isHistoryLoading, isInitialized]);

  // === Load Day Data ===
  useEffect(() => {
    if (!isInitialized || isHistoryLoading) return;

    const currentEntries = state.foodEntries.filter(
      (e) => e.date === state.selectedDate
    );
    const currentWater = state.waterEntries.filter(
      (e) => e.date === state.selectedDate
    );

    if (currentEntries.length === 0 && currentWater.length === 0) {
      const record = getDailySummaryRecord(state.selectedDate);
      const currentActiveMealPlan = getActiveMealPlan();

      let loadedFoodEntries: FoodEntry[] = [];
      let loadedWaterEntries: WaterEntry[] = [];
      let loadedGoals: DailyGoals =
        currentActiveMealPlan?.dailyGoals || state.dailyGoals;

      if (record) {
        loadedFoodEntries = record.entries;
        loadedWaterEntries = record.waterEntries;
        loadedGoals = record.goals;
      } else if (currentActiveMealPlan) {
        loadedFoodEntries = currentActiveMealPlan.plannedFoodTemplates.map(
          (template) => ({
            ...template,
            id: `food_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            date: state.selectedDate,
            time: new Date().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            status: "planned",
            plannedAt: new Date().toISOString(),
          })
        );
        loadedWaterEntries = currentActiveMealPlan.plannedWaterTemplates.map(
          (template) => ({
            ...template,
            id: `water_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            date: state.selectedDate,
            time: new Date().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            status: "planned",
            plannedAt: new Date().toISOString(),
          })
        );
      }

      dispatch({
        type: "LOAD_NUTRITION_DATA",
        payload: {
          ...state,
          foodEntries: [...state.foodEntries, ...loadedFoodEntries],
          waterEntries: [...state.waterEntries, ...loadedWaterEntries],
          dailyGoals: loadedGoals,
        },
      });
    }
  }, [
    state.selectedDate,
    isInitialized,
    isHistoryLoading,
    getDailySummaryRecord,
    getActiveMealPlan,
    state.foodEntries,
    state.waterEntries,
    state.dailyGoals,
    state,
  ]);

  // === Update Goals ===
  useEffect(() => {
    if (!isInitialized) return;

    if (activeMealPlan && activeMealPlan.dailyGoals) {
      dispatch({
        type: "UPDATE_DAILY_GOALS",
        payload: activeMealPlan.dailyGoals,
      });
    }
  }, [activeMealPlan, isInitialized]);

  // === Save Summary ===
  useEffect(() => {
    if (!isInitialized) return;

    const todayEntries = state.foodEntries.filter(
      (e) => e.date === state.selectedDate
    );
    const todayWater = state.waterEntries.filter(
      (e) => e.date === state.selectedDate
    );

    const plannedFood = todayEntries.filter((e) => e.status === "planned");
    const consumedFood = todayEntries.filter((e) => e.status === "consumed");
    const plannedWater = todayWater.filter((e) => e.status === "planned");
    const consumedWater = todayWater.filter((e) => e.status === "consumed");

    const totals = consumedFood.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.calories,
        protein: acc.protein + entry.protein,
        carbs: acc.carbs + entry.carbs,
        fat: acc.fat + entry.fat,
        water: acc.water,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 }
    );

    totals.water = consumedWater.reduce((sum, e) => sum + e.amount, 0);

    const foodCompletionPercentage =
      plannedFood.length > 0
        ? Math.round((consumedFood.length / plannedFood.length) * 100)
        : 0;

    const waterCompletionPercentage =
      plannedWater.length > 0
        ? Math.round((consumedWater.length / plannedWater.length) * 100)
        : 0;

    const overallCompletionPercentage =
      plannedFood.length + plannedWater.length > 0
        ? Math.round(
            ((consumedFood.length + consumedWater.length) /
              (plannedFood.length + plannedWater.length)) *
              100
          )
        : 0;

    const currentRecord: DailySummaryRecord = {
      date: state.selectedDate,
      entries: todayEntries,
      waterEntries: todayWater,
      totals,
      goals: state.dailyGoals,
      plannedFoodEntries: plannedFood,
      consumedFoodEntries: consumedFood,
      plannedWaterEntries: plannedWater,
      consumedWaterEntries: consumedWater,
      completionStats: {
        foodItemsPlanned: plannedFood.length,
        foodItemsConsumed: consumedFood.length,
        waterItemsPlanned: plannedWater.length,
        waterItemsConsumed: consumedWater.length,
        foodCompletionPercentage,
        waterCompletionPercentage,
        overallCompletionPercentage,
      },
      isCompleted: overallCompletionPercentage >= 95,
      completedAt:
        overallCompletionPercentage >= 95 ? new Date().toISOString() : null,
    };

    const recordString = JSON.stringify(currentRecord);
    if (lastSavedRecord.current !== recordString) {
      updateDailySummaryRecord(currentRecord);
      lastSavedRecord.current = recordString;
    }
  }, [
    state.foodEntries,
    state.waterEntries,
    state.selectedDate,
    state.dailyGoals,
    isInitialized,
    updateDailySummaryRecord,
  ]);

  // === Persistence ===
  useNutritionPersistence({
    state,
    isInitialized,
    onWarning: (message) => addToast(message, "warning", 6000),
  });

  // === Calculations ===
  const {
    getEntriesByStatus,
    getWaterByStatus,
    getMealPlanningStats,
    getDailyPlanningOverview,
  } = useNutritionCalculations(state);

  // === Actions ===
  const addFoodEntry = useCallback(
    (entry: Omit<FoodEntry, "id" | "status" | "plannedAt">) => {
      dispatch({ type: "ADD_FOOD_ENTRY", payload: entry });
    },
    []
  );

  const removeFoodEntry = useCallback((id: string) => {
    dispatch({ type: "REMOVE_FOOD_ENTRY", payload: id });
  }, []);

  const addWaterEntry = useCallback(
    (amount: number, date?: string, time?: string) => {
      dispatch({
        type: "ADD_WATER_ENTRY",
        payload: { amount, date, time },
      });
    },
    []
  );

  const removeWaterEntry = useCallback((id: string) => {
    dispatch({ type: "REMOVE_WATER_ENTRY", payload: id });
  }, []);

  const updateDailyGoals = useCallback((goals: Partial<DailyGoals>) => {
    dispatch({ type: "UPDATE_DAILY_GOALS", payload: goals });
  }, []);

  const setSelectedDate = useCallback((date: string) => {
    lastSavedRecord.current = "";
    dispatch({ type: "SET_SELECTED_DATE", payload: date });
  }, []);

  const markFoodAsConsumed = useCallback((id: string) => {
    dispatch({ type: "MARK_FOOD_AS_CONSUMED", payload: id });
  }, []);

  const markFoodAsPlanned = useCallback((id: string) => {
    dispatch({ type: "MARK_FOOD_AS_PLANNED", payload: id });
  }, []);

  const markWaterAsConsumed = useCallback((id: string) => {
    dispatch({ type: "MARK_WATER_AS_CONSUMED", payload: id });
  }, []);

  const markWaterAsPlanned = useCallback((id: string) => {
    dispatch({ type: "MARK_WATER_AS_PLANNED", payload: id });
  }, []);

  const migrateExistingData = useCallback(() => {
    dispatch({ type: "MIGRATE_EXISTING_DATA", payload: undefined });
  }, []);

  // === Computed Values ===
  const todayEntries = useMemo(() => {
    return getEntriesByStatus("all");
  }, [getEntriesByStatus]);

  const todayConsumedEntries = useMemo(() => {
    return getEntriesByStatus("consumed");
  }, [getEntriesByStatus]);

  const todayPlannedEntries = useMemo(() => {
    return getEntriesByStatus("planned");
  }, [getEntriesByStatus]);

  const todayConsumedWater = useMemo(() => {
    return getWaterByStatus("consumed");
  }, [getWaterByStatus]);

  const todayPlannedWater = useMemo(() => {
    return getWaterByStatus("planned");
  }, [getWaterByStatus]);

  // === Context Value ===
  const value = useMemo(
    () => ({
      state,
      todayEntries,
      todayConsumedEntries,
      todayPlannedEntries,
      todayConsumedWater,
      todayPlannedWater,
      addFoodEntry,
      removeFoodEntry,
      addWaterEntry,
      removeWaterEntry,
      updateDailyGoals,
      setSelectedDate,
      markFoodAsConsumed,
      markFoodAsPlanned,
      markWaterAsConsumed,
      markWaterAsPlanned,
      migrateExistingData,
      getEntriesByStatus,
      getWaterByStatus,
      getDailyPlanningOverview,
      getMealPlanningStats,
      createMealPlan,
      setActiveMealPlan,
      getActiveMealPlan,
      addFoodToMealPlanTemplate,
      removeFoodFromMealPlanTemplate,
      getDailySummaryRecord,
      getNutritionHistory: () => ({
        dailyRecords: getDailySummaryRecord(state.selectedDate)
          ? { [state.selectedDate]: getDailySummaryRecord(state.selectedDate)! }
          : {},
        mealPlans,
        activeMealPlanId,
        achievements: getAchievements(),
        streaks,
      }),
      getHistoryStats,
      getAchievements,
      activeMealPlan,
    }),
    [
      state,
      todayEntries,
      todayConsumedEntries,
      todayPlannedEntries,
      todayConsumedWater,
      todayPlannedWater,
      addFoodEntry,
      removeFoodEntry,
      addWaterEntry,
      removeWaterEntry,
      updateDailyGoals,
      setSelectedDate,
      markFoodAsConsumed,
      markFoodAsPlanned,
      markWaterAsConsumed,
      markWaterAsPlanned,
      migrateExistingData,
      getEntriesByStatus,
      getWaterByStatus,
      getDailyPlanningOverview,
      getMealPlanningStats,
      createMealPlan,
      setActiveMealPlan,
      getActiveMealPlan,
      addFoodToMealPlanTemplate,
      removeFoodFromMealPlanTemplate,
      getDailySummaryRecord,
      mealPlans,
      activeMealPlanId,
      getAchievements,
      streaks,
      getHistoryStats,
      activeMealPlan,
    ]
  );

  return (
    <NutritionContext.Provider value={value}>
      {children}
    </NutritionContext.Provider>
  );
}
