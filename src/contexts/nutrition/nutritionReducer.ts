// Nutrition Reducer
import type {
  NutritionState,
  NutritionAction,
  FoodEntry,
  WaterEntry,
} from "../../types/nutrition";

export const initialState: NutritionState = {
  foodEntries: [],
  waterEntries: [],
  dailyGoals: {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
    water: 2000,
  },
  selectedDate: new Date().toISOString().split("T")[0],
};

export function nutritionReducer(
  state: NutritionState,
  action: NutritionAction
): NutritionState {
  switch (action.type) {
    case "ADD_FOOD_ENTRY": {
      const newEntry: FoodEntry = {
        ...action.payload,
        id: `food_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: "planned",
        plannedAt: new Date().toISOString(),
      };

      return {
        ...state,
        foodEntries: [...state.foodEntries, newEntry],
      };
    }

    case "REMOVE_FOOD_ENTRY": {
      const entryToRemove = state.foodEntries.find(e => e.id === action.payload);
      console.log("🗑️ REMOVE_FOOD_ENTRY action triggered");
      console.log("   Removing entry:", entryToRemove?.name, "ID:", action.payload);
      console.log("   Before removal: ", state.foodEntries.length, "entries");
      const newEntries = state.foodEntries.filter(
        (entry) => entry.id !== action.payload
      );
      console.log("   After removal: ", newEntries.length, "entries");
      return {
        ...state,
        foodEntries: newEntries,
      };
    }

    case "ADD_WATER_ENTRY": {
      const waterEntry: WaterEntry = {
        id: `water_${Date.now()}`,
        amount: action.payload.amount,
        date: action.payload.date || state.selectedDate,
        time:
          action.payload.time ||
          new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        status: "planned",
        plannedAt: new Date().toISOString(),
      };

      return {
        ...state,
        waterEntries: [...state.waterEntries, waterEntry],
      };
    }

    case "REMOVE_WATER_ENTRY":
      return {
        ...state,
        waterEntries: state.waterEntries.filter(
          (entry) => entry.id !== action.payload
        ),
      };

    case "UPDATE_DAILY_GOALS":
      return {
        ...state,
        dailyGoals: { ...state.dailyGoals, ...action.payload },
      };

    case "SET_SELECTED_DATE":
      return {
        ...state,
        selectedDate: action.payload,
      };

    case "MARK_FOOD_AS_CONSUMED":
      return {
        ...state,
        foodEntries: state.foodEntries.map((entry) =>
          entry.id === action.payload
            ? {
                ...entry,
                status: "consumed",
                consumedAt: new Date().toISOString(),
              }
            : entry
        ),
      };

    case "MARK_FOOD_AS_PLANNED":
      return {
        ...state,
        foodEntries: state.foodEntries.map((entry) =>
          entry.id === action.payload
            ? { ...entry, status: "planned", consumedAt: undefined }
            : entry
        ),
      };

    case "MARK_WATER_AS_CONSUMED":
      return {
        ...state,
        waterEntries: state.waterEntries.map((entry) =>
          entry.id === action.payload
            ? {
                ...entry,
                status: "consumed",
                consumedAt: new Date().toISOString(),
              }
            : entry
        ),
      };

    case "MARK_WATER_AS_PLANNED":
      return {
        ...state,
        waterEntries: state.waterEntries.map((entry) =>
          entry.id === action.payload
            ? { ...entry, status: "planned", consumedAt: undefined }
            : entry
        ),
      };

    case "MIGRATE_EXISTING_DATA":
      return {
        ...state,
        foodEntries: state.foodEntries.map((entry) => ({
          ...entry,
          status: entry.status || "consumed",
          plannedAt: entry.plannedAt || entry.time || new Date().toISOString(),
        })),
        waterEntries: state.waterEntries.map((entry) => ({
          ...entry,
          status: entry.status || "consumed",
          plannedAt: entry.plannedAt || entry.time || new Date().toISOString(),
        })),
      };

    case "LOAD_NUTRITION_DATA":
      return action.payload;

    default:
      return state;
  }
}
