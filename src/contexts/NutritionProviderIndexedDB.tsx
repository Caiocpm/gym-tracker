// src/contexts/NutritionProviderIndexedDB.tsx
// Provider de Nutrição usando IndexedDB

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
import { useNutritionCalculations } from "./nutrition/useNutritionCalculations";
import { db } from "../db/database";
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
  const isSaving = useRef(false);

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

  // ============================================================================
  //                          CRIAR PLANO DE REFEIÇÃO PADRÃO
  // ============================================================================

  useEffect(() => {
    if (isHistoryLoading || !isInitialized) return;

    // Se não existe plano ativo, criar um padrão
    if (!activeMealPlan && mealPlans.length === 0) {
      console.log("🍽️ Criando plano de refeição padrão...");
      createMealPlan({
        name: "Dieta Diária",
        description: "Plano de refeições padrão",
        dailyGoals: initialState.dailyGoals,
        plannedFoodTemplates: [],
        plannedWaterTemplates: [],
      });
    }
  }, [isHistoryLoading, isInitialized, activeMealPlan, mealPlans, createMealPlan]);

  // ============================================================================
  //                          CARREGAR DADOS INICIAIS
  // ============================================================================

  useEffect(() => {
    const loadInitialData = async () => {
      if (isHistoryLoading || isInitialized) return;

      try {
        console.log("🚀 Initializing nutrition context");
        // NÃO carregar do IndexedDB aqui!
        // Os dados serão carregados do DailySummaryRecord pelo useEffect de "Load Data"

        setIsInitialized(true);
      } catch (error) {
        console.error("❌ Erro ao carregar dados de nutrição:", error);
        setIsInitialized(true);
      }
    };

    loadInitialData();
  }, [isHistoryLoading, isInitialized]);

  // ============================================================================
  //                          SALVAR NO INDEXEDDB
  // ============================================================================

  const saveToIndexedDB = useCallback(async () => {
    if (isSaving.current || !isInitialized) return;

    isSaving.current = true;

    try {
      // Salvar entradas de comida
      if (state.foodEntries.length > 0) {
        await db.foodEntries.bulkPut(state.foodEntries);
      }

      // Salvar entradas de água
      if (state.waterEntries.length > 0) {
        await db.waterEntries.bulkPut(state.waterEntries);
      }

      // Salvar metas diárias
      await db.dailyGoals.put({
        id: "current",
        goals: state.dailyGoals,
      });

      console.log("💾 Dados de nutrição salvos no IndexedDB");
    } catch (error) {
      console.error("❌ Erro ao salvar dados de nutrição:", error);

      // Se der erro de quota, limpar dados antigos
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoffDate = thirtyDaysAgo.toISOString().split("T")[0];

      try {
        await db.foodEntries.where("date").below(cutoffDate).delete();
        await db.waterEntries.where("date").below(cutoffDate).delete();

        addToast("⚠️ Dados antigos foram removidos para liberar espaço", "warning", 5000);
      } catch (cleanupError) {
        console.error("❌ Erro ao limpar dados antigos:", cleanupError);
      }
    } finally {
      isSaving.current = false;
    }
  }, [state.foodEntries, state.waterEntries, state.dailyGoals, isInitialized, addToast]);

  // Auto-save quando dados mudam
  useEffect(() => {
    if (!isInitialized) return;

    const timeoutId = setTimeout(() => {
      saveToIndexedDB();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [state.foodEntries, state.waterEntries, state.dailyGoals, isInitialized, saveToIndexedDB]);

  // ============================================================================
  //                          CARREGAR DADOS DO DIA
  // ============================================================================

  useEffect(() => {
    if (!isInitialized || isHistoryLoading) return;

    console.log("📂 Load Data useEffect triggered for date:", state.selectedDate);

    const currentEntries = state.foodEntries.filter(
      (e) => e.date === state.selectedDate
    );
    const currentWater = state.waterEntries.filter(
      (e) => e.date === state.selectedDate
    );

    console.log("   Current entries in state:", currentEntries.length);
    console.log("   Current water in state:", currentWater.length);

    // Só carregar dados se não há entradas no estado atual para este dia
    if (currentEntries.length === 0 && currentWater.length === 0) {
      console.log("   No entries in state, loading from history...");
      const record = getDailySummaryRecord(state.selectedDate);
      const currentActiveMealPlan = getActiveMealPlan();

      let loadedFoodEntries: FoodEntry[] = [];
      let loadedWaterEntries: WaterEntry[] = [];
      let loadedGoals: DailyGoals =
        currentActiveMealPlan?.dailyGoals || state.dailyGoals;

      // Se existe um record, carregar dele (mesmo que vazio)
      if (record) {
        console.log("   ✅ Found DailySummaryRecord with", record.entries.length, "entries");
        console.log("   📋 Loading entries:", record.entries.map(e => e.name));
        loadedFoodEntries = record.entries;
        loadedWaterEntries = record.waterEntries;
        loadedGoals = record.goals;
      }
      // APENAS carregar templates se NÃO existe record (dia nunca foi acessado antes)
      else if (currentActiveMealPlan) {
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

      // Só despachar se realmente há dados para carregar
      if (loadedFoodEntries.length > 0 || loadedWaterEntries.length > 0 || record) {
        console.log("   📤 Dispatching LOAD_NUTRITION_DATA with", loadedFoodEntries.length, "food entries");

        // Filtrar entradas de outros dias para manter no estado
        const otherDaysFoodEntries = state.foodEntries.filter(e => e.date !== state.selectedDate);
        const otherDaysWaterEntries = state.waterEntries.filter(e => e.date !== state.selectedDate);

        console.log("   📋 Keeping", otherDaysFoodEntries.length, "entries from other days");
        console.log("   📋 Adding", loadedFoodEntries.length, "entries for", state.selectedDate);

        dispatch({
          type: "LOAD_NUTRITION_DATA",
          payload: {
            ...state,
            foodEntries: [...otherDaysFoodEntries, ...loadedFoodEntries],
            waterEntries: [...otherDaysWaterEntries, ...loadedWaterEntries],
            dailyGoals: loadedGoals,
          },
        });
      } else {
        console.log("   ⏭️ No data to load");
      }
    } else {
      console.log("   ⏭️ Skipping load - entries already in state");
    }
  }, [
    state.selectedDate,
    isInitialized,
    isHistoryLoading,
    getDailySummaryRecord,
    getActiveMealPlan,
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

    console.log("🔄 Save Summary useEffect triggered");
    console.log("📅 Selected Date:", state.selectedDate);
    console.log("🍔 Total Food Entries in State:", state.foodEntries.length);

    const todayEntries = state.foodEntries.filter(
      (e) => e.date === state.selectedDate
    );
    const todayWater = state.waterEntries.filter(
      (e) => e.date === state.selectedDate
    );

    console.log("🍔 Today's Food Entries:", todayEntries.length);
    console.log("💧 Today's Water Entries:", todayWater.length);

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
      console.log("💾 Saving DailySummaryRecord with", todayEntries.length, "food entries");
      console.log("📋 Food entries being saved:", todayEntries.map(e => e.name));
      updateDailySummaryRecord(currentRecord);
      lastSavedRecord.current = recordString;
    } else {
      console.log("⏭️ Skipping save - record unchanged");
    }
  }, [
    state.foodEntries,
    state.waterEntries,
    state.selectedDate,
    state.dailyGoals,
    isInitialized,
    updateDailySummaryRecord,
  ]);

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

// Re-exportar o hook useNutrition do NutritionContext
export { useNutrition } from "./NutritionContext";
