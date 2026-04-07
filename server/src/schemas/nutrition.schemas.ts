import { z } from 'zod';

const micronutrientsSchema = z.object({
  fiber: z.number().nonnegative().optional(),
  sugar: z.number().nonnegative().optional(),
  sodium: z.number().nonnegative().optional(),
  calcium: z.number().nonnegative().optional(),
  iron: z.number().nonnegative().optional(),
  vitaminC: z.number().nonnegative().optional(),
  vitaminA: z.number().nonnegative().optional(),
}).optional();

// ─── Food Entry ───────────────────────────────────────────────────────────────

export const createFoodEntrySchema = z.object({
  // Aceita tanto "name" (API direta) quanto "foodName" (mobile)
  name: z.string().optional(),
  foodName: z.string().optional(),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  quantity: z.number().positive().optional().default(1),
  unit: z.string().optional(),
  // Aceita tanto "meal" quanto "mealType" (mobile)
  meal: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  date: z.string().min(1, 'Data obrigatória'),
  time: z.string().optional(),
  micronutrients: micronutrientsSchema,
  status: z.enum(['planned', 'consumed']).optional().default('consumed'),
  plannedAt: z.string().optional(),
  consumedAt: z.string().optional(),
});

export const updateFoodEntrySchema = createFoodEntrySchema.partial();

// ─── Water Entry ──────────────────────────────────────────────────────────────

export const createWaterEntrySchema = z.object({
  amount: z.number().positive('Quantidade deve ser positiva'),
  date: z.string().min(1, 'Data obrigatória'),
  time: z.string().optional(),
  status: z.enum(['planned', 'consumed']).optional().default('planned'),
  plannedAt: z.string().optional(),
  consumedAt: z.string().optional(),
});

export const updateWaterEntrySchema = createWaterEntrySchema.partial();

// ─── Daily Goals ──────────────────────────────────────────────────────────────

export const updateDailyGoalsSchema = z.object({
  calories: z.number().positive().optional(),
  protein: z.number().nonnegative().optional(),
  carbs: z.number().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
  water: z.number().positive().optional(),
});

// ─── Predefined Food ──────────────────────────────────────────────────────────

export const createPredefinedFoodSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  servingSize: z.number().positive().optional(),
  servingUnit: z.string().optional(),
  micronutrients: micronutrientsSchema,
});

export const updatePredefinedFoodSchema = createPredefinedFoodSchema.partial();

// ─── Diet Plan ────────────────────────────────────────────────────────────────

export const createDietPlanItemSchema = z.object({
  name: z.string().min(1),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  quantity: z.number().positive().optional().default(1),
  unit: z.string().optional().default('g'),
  meal: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  sortOrder: z.number().int().optional().default(0),
});

export const updateDietPlanItemSchema = createDietPlanItemSchema.partial();

export type CreateDietPlanItemInput = z.infer<typeof createDietPlanItemSchema>;
export type UpdateDietPlanItemInput = z.infer<typeof updateDietPlanItemSchema>;

// ─── Query Params ─────────────────────────────────────────────────────────────

export const listEntriesQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  date: z.string().optional(),
});

export const listFoodsQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
});

export type CreateFoodEntryInput = z.infer<typeof createFoodEntrySchema>;
export type UpdateFoodEntryInput = z.infer<typeof updateFoodEntrySchema>;
export type CreateWaterEntryInput = z.infer<typeof createWaterEntrySchema>;
export type UpdateWaterEntryInput = z.infer<typeof updateWaterEntrySchema>;
export type UpdateDailyGoalsInput = z.infer<typeof updateDailyGoalsSchema>;
export type CreatePredefinedFoodInput = z.infer<typeof createPredefinedFoodSchema>;
