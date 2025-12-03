// src/types/nutrition.ts

// ============================================================================
//                                 ENTRIES
// ============================================================================

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  date: string; // Formato YYYY-MM-DD
  time: string; // Formato HH:MM
  micronutrients?: Micronutrients;

  // ✅ CAMPOS PARA SISTEMA DE CHECK-LIST
  status: "planned" | "consumed";
  consumedAt?: string; // Timestamp ISO quando foi marcado como consumido
  plannedAt: string; // Timestamp ISO quando foi planejado
}

export interface WaterEntry {
  id: string;
  amount: number;
  date: string; // Formato YYYY-MM-DD
  time: string; // Formato HH:MM

  // ✅ CAMPOS PARA SISTEMA DE CHECK-LIST
  status: "planned" | "consumed";
  consumedAt?: string; // Timestamp ISO quando foi marcado como consumido
  plannedAt: string; // Timestamp ISO quando foi planejado
}

// ============================================================================
//                                 NUTRIENTS
// ============================================================================

export interface Micronutrients {
  vitaminA?: number;
  vitaminB1?: number;
  vitaminB2?: number;
  vitaminB3?: number;
  vitaminB6?: number;
  vitaminB12?: number;
  vitaminC?: number;
  vitaminE?: number;
  folate?: number;
  calcium?: number;
  iron?: number;
  magnesium?: number;
  phosphorus?: number;
  potassium?: number;
  sodium?: number;
  zinc?: number;
  copper?: number;
  manganese?: number;
  selenium?: number;
  fiber?: number;
  cholesterol?: number;

  // ✅ PERMITIR MICRONUTRIENTES DINÂMICOS (para sistema de metas personalizadas)
  [key: string]: number | undefined;
}

export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
}

// ============================================================================
//                                 CATEGORIES & PREDEFINED FOODS
// ============================================================================

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type FoodCategory =
  | "carbs"
  | "protein"
  | "fruits"
  | "vegetables"
  | "fats"
  | "dairy"
  | "beverages"
  | "cereals"
  | "meat"
  | "legumes"
  | "oils"
  | "sweets"
  | "snacks"
  | "recipes"
  | "other";

export interface PredefinedFood {
  id: string;
  name: string;
  category: FoodCategory;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  micronutrients?: Micronutrients;
  icon?: string;
}

// ============================================================================
//                                 NUTRITION STATE & ACTIONS
// ============================================================================

export interface NutritionState {
  foodEntries: FoodEntry[];
  waterEntries: WaterEntry[];
  dailyGoals: DailyGoals; // Estas metas serão as do plano ativo para o dia selecionado
  selectedDate: string; // Formato YYYY-MM-DD
}

export type NutritionAction =
  | {
      type: "ADD_FOOD_ENTRY";
      payload: Omit<FoodEntry, "id" | "status" | "plannedAt">;
    }
  | { type: "REMOVE_FOOD_ENTRY"; payload: string }
  | {
      type: "ADD_WATER_ENTRY";
      payload: { amount: number; date?: string; time?: string };
    }
  | { type: "REMOVE_WATER_ENTRY"; payload: string }
  | { type: "UPDATE_DAILY_GOALS"; payload: Partial<DailyGoals> }
  | { type: "SET_SELECTED_DATE"; payload: string }
  | { type: "LOAD_NUTRITION_DATA"; payload: NutritionState }
  | { type: "MARK_FOOD_AS_CONSUMED"; payload: string }
  | { type: "MARK_FOOD_AS_PLANNED"; payload: string }
  | { type: "MARK_WATER_AS_CONSUMED"; payload: string }
  | { type: "MARK_WATER_AS_PLANNED"; payload: string }
  | { type: "MIGRATE_EXISTING_DATA"; payload: undefined };

// ============================================================================
//                                 DAILY SUMMARY & PLANNING
// ============================================================================

// DailySummaryRecord é o que antes era DailyNutrition, mas agora com campos de gamificação
export interface DailySummaryRecord {
  date: string; // Formato YYYY-MM-DD
  entries: FoodEntry[]; // Todas as entradas de alimento do dia (planejadas e consumidas)
  waterEntries: WaterEntry[]; // Todas as entradas de água do dia (planejadas e consumidas)

  totals: {
    // Totais de macronutrientes dos itens CONSUMIDOS
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number; // Total de água consumida
  };

  goals: DailyGoals; // Metas para este dia específico (do plano ativo)

  // Estatísticas de checklist
  plannedFoodEntries: FoodEntry[];
  consumedFoodEntries: FoodEntry[];
  plannedWaterEntries: WaterEntry[];
  consumedWaterEntries: WaterEntry[];
  completionStats: {
    // Estatísticas gerais de conclusão para o dia
    foodItemsPlanned: number;
    foodItemsConsumed: number;
    waterItemsPlanned: number;
    waterItemsConsumed: number;
    foodCompletionPercentage: number; // % de conclusão para alimentos
    waterCompletionPercentage: number; // % de conclusão para água
    overallCompletionPercentage: number; // % de conclusão geral
  };

  // ✅ NOVOS CAMPOS PARA GAMIFICAÇÃO E HISTÓRICO
  isCompleted: boolean; // Se o dia foi considerado "completo" (ex: >95% das metas)
  completedAt: string | null; // Timestamp ISO de quando o dia foi marcado como completo
}

export interface MealPlanningStats {
  meal: MealType;
  plannedItems: number;
  consumedItems: number;
  plannedCalories: number;
  consumedCalories: number;
  completionPercentage: number;
}

export interface DailyPlanningOverview {
  date: string;
  totalPlannedItems: number;
  totalConsumedItems: number;
  totalPlannedCalories: number;
  totalConsumedCalories: number;
  overallCompletionPercentage: number;
  mealStats: MealPlanningStats[];
  waterStats: {
    plannedAmount: number;
    consumedAmount: number;
    completionPercentage: number;
  };
}

// ============================================================================
//                                 FILTERS & VALIDATION
// ============================================================================

export type EntryStatus = "planned" | "consumed" | "all";

export interface NutritionFilters {
  date?: string;
  meal?: MealType;
  status?: EntryStatus;
  category?: FoodCategory;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FoodEntryValidation extends ValidationResult {
  entry?: Partial<FoodEntry>;
}

export interface WaterEntryValidation extends ValidationResult {
  entry?: Partial<WaterEntry>;
}

// ============================================================================
//                                 HISTORY & GAMIFICATION
// ============================================================================

export interface MealPlan {
  id: string;
  name: string;
  description?: string;
  createdAt: string; // Timestamp ISO
  lastUpdated: string; // Timestamp ISO
  isActive: boolean; // Se este plano está ativo para o dia atual

  dailyGoals: DailyGoals; // Metas diárias que este plano define

  // Itens planejados que se repetem (templates)
  // Estes são os "arquivos planejados que permanecem sempre lá"
  plannedFoodTemplates: Omit<
    FoodEntry,
    "id" | "date" | "time" | "status" | "consumedAt" | "plannedAt"
  >[];
  plannedWaterTemplates: Omit<
    WaterEntry,
    "id" | "date" | "time" | "status" | "consumedAt" | "plannedAt"
  >[];
}

export interface NutritionHistory {
  dailyRecords: Record<string, DailySummaryRecord>; // key: YYYY-MM-DD
  mealPlans: MealPlan[];
  activeMealPlanId: string | null; // ID do plano de refeição ativo
  achievements: Achievement[];
  streaks: StreakData;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string | null; // Timestamp ISO ou null se não desbloqueado
  type: "streak" | "completion" | "nutrition" | "custom";
}

export interface StreakData {
  current: number;
  longest: number;
  lastCompletedDate: string | null; // Formato YYYY-MM-DD
}

// ============================================================================
//                                 NUTRITION CONTEXT TYPE
// ============================================================================

export interface NutritionContextType {
  state: NutritionState;

  // Funções básicas
  addFoodEntry: (entry: Omit<FoodEntry, "id" | "status" | "plannedAt">) => void;
  removeFoodEntry: (id: string) => void;
  addWaterEntry: (amount: number, date?: string, time?: string) => void;
  removeWaterEntry: (id: string) => void;
  updateDailyGoals: (goals: Partial<DailyGoals>) => void; // Atualiza metas do plano ativo
  setSelectedDate: (date: string) => void;

  // Funções para check-list
  markFoodAsConsumed: (id: string) => void;
  markFoodAsPlanned: (id: string) => void;
  markWaterAsConsumed: (id: string) => void;
  markWaterAsPlanned: (id: string) => void;

  // Funções helper para filtros e overview
  getEntriesByStatus: (status: EntryStatus, date?: string) => FoodEntry[];
  getWaterByStatus: (status: EntryStatus, date?: string) => WaterEntry[];
  getDailyPlanningOverview: (date?: string) => DailyPlanningOverview;
  getMealPlanningStats: (meal: MealType, date?: string) => MealPlanningStats;

  // Funções para migração
  migrateExistingData: () => void;

  // ✅ NOVAS FUNÇÕES DO HISTÓRICO E PLANOS DE REFEIÇÃO
  createMealPlan: (
    plan: Omit<MealPlan, "id" | "createdAt" | "lastUpdated" | "isActive">
  ) => MealPlan;
  setActiveMealPlan: (planId: string) => void;
  getActiveMealPlan: () => MealPlan | null;
  addFoodToMealPlanTemplate: (
    planId: string,
    foodTemplate: Omit<
      FoodEntry,
      "id" | "date" | "time" | "status" | "consumedAt" | "plannedAt"
    >
  ) => void;
  removeFoodFromMealPlanTemplate: (
    planId: string,
    foodName: string,
    meal: MealType
  ) => void;
  getDailySummaryRecord: (date: string) => DailySummaryRecord | null; // Obter registro de um dia específico
  getNutritionHistory: () => NutritionHistory; // Obter o objeto de histórico completo
  getHistoryStats: () => {
    // Estatísticas para gamificação
    completedDays: number;
    totalDays: number;
    completionRate: number;
    currentStreak: number;
    longestStreak: number;
    unlockedAchievements: number;
    totalAchievements: number;
  };
  getAchievements: () => Achievement[]; // Obter lista de achievements

  // Propriedades computadas úteis
  todayEntries: FoodEntry[];
  todayConsumedEntries: FoodEntry[];
  todayPlannedEntries: FoodEntry[];
  todayConsumedWater: WaterEntry[];
  todayPlannedWater: WaterEntry[];

  // ✅ Adicionar o plano de refeição ativo diretamente no contexto
  activeMealPlan: MealPlan | null;
}

// ============================================================================
//                                 CONSTANTS
// ============================================================================

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Café da Manhã",
  lunch: "Almoço",
  dinner: "Jantar",
  snack: "Lanche",
};

export const MEAL_ICONS: Record<MealType, string> = {
  breakfast: "🌅",
  lunch: "🌞",
  dinner: "��",
  snack: "🍎",
};

export const STATUS_LABELS: Record<"planned" | "consumed", string> = {
  planned: "Planejado",
  consumed: "Consumido",
};

export const STATUS_ICONS: Record<"planned" | "consumed", string> = {
  planned: "⏳",
  consumed: "✅",
};
