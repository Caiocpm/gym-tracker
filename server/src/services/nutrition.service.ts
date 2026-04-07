import prisma from '../config/database';
import { AppError } from '../types/api.types';
import type {
  CreateFoodEntryInput,
  UpdateFoodEntryInput,
  CreateWaterEntryInput,
  UpdateWaterEntryInput,
  UpdateDailyGoalsInput,
  CreatePredefinedFoodInput,
  CreateDietPlanItemInput,
  UpdateDietPlanItemInput,
} from '../schemas/nutrition.schemas';

const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 250, fat: 65, water: 2500 };

export const nutritionService = {
  // ─── Food Entries ───────────────────────────────────────────────────────────

  async listFoodEntries(userId: string, filters: { startDate?: string; endDate?: string; date?: string }) {
    return prisma.foodEntry.findMany({
      where: {
        userId,
        date: filters.date
          ? filters.date
          : filters.startDate || filters.endDate
          ? {
              ...(filters.startDate ? { gte: filters.startDate } : {}),
              ...(filters.endDate ? { lte: filters.endDate } : {}),
            }
          : undefined,
      },
      orderBy: { date: 'desc' },
    });
  },

  async getFoodEntry(userId: string, entryId: string) {
    const entry = await prisma.foodEntry.findFirst({ where: { id: entryId, userId } });
    if (!entry) throw new AppError(404, 'Refeição não encontrada');
    return entry;
  },

  async createFoodEntry(userId: string, data: CreateFoodEntryInput) {
    const d = data as any;
    return prisma.foodEntry.create({
      data: {
        userId,
        name: d.name ?? d.foodName ?? '',
        calories: d.calories,
        protein: d.protein,
        carbs: d.carbs,
        fat: d.fat,
        quantity: d.quantity ?? 1,
        meal: d.meal ?? d.mealType ?? null,
        date: typeof d.date === 'string' ? d.date.split('T')[0] : d.date,
        time: d.time ?? null,
        micronutrients: d.micronutrients ?? null,
        status: d.status ?? 'consumed',
        plannedAt: d.plannedAt ?? null,
        consumedAt: d.consumedAt ?? null,
      },
    });
  },

  async updateFoodEntry(userId: string, entryId: string, data: UpdateFoodEntryInput) {
    const existing = await prisma.foodEntry.findFirst({ where: { id: entryId, userId } });
    if (!existing) throw new AppError(404, 'Refeição não encontrada');
    return prisma.foodEntry.update({ where: { id: entryId }, data });
  },

  async deleteFoodEntry(userId: string, entryId: string) {
    const existing = await prisma.foodEntry.findFirst({ where: { id: entryId, userId } });
    if (!existing) throw new AppError(404, 'Refeição não encontrada');
    await prisma.foodEntry.delete({ where: { id: entryId } });
  },

  async consumeFoodEntry(userId: string, entryId: string) {
    return this.updateFoodEntry(userId, entryId, {
      status: 'consumed',
      consumedAt: new Date().toISOString(),
    });
  },

  async unconsumeFoodEntry(userId: string, entryId: string) {
    return this.updateFoodEntry(userId, entryId, { status: 'planned', consumedAt: undefined });
  },

  // ─── Water Entries ──────────────────────────────────────────────────────────

  async listWaterEntries(userId: string, filters: { startDate?: string; endDate?: string; date?: string }) {
    return prisma.waterEntry.findMany({
      where: {
        userId,
        date: filters.date
          ? filters.date
          : filters.startDate || filters.endDate
          ? {
              ...(filters.startDate ? { gte: filters.startDate } : {}),
              ...(filters.endDate ? { lte: filters.endDate } : {}),
            }
          : undefined,
      },
      orderBy: { date: 'desc' },
    });
  },

  async getWaterEntry(userId: string, entryId: string) {
    const entry = await prisma.waterEntry.findFirst({ where: { id: entryId, userId } });
    if (!entry) throw new AppError(404, 'Entrada de água não encontrada');
    return entry;
  },

  async createWaterEntry(userId: string, data: CreateWaterEntryInput) {
    return prisma.waterEntry.create({ data: { ...data, userId } });
  },

  async updateWaterEntry(userId: string, entryId: string, data: UpdateWaterEntryInput) {
    const existing = await prisma.waterEntry.findFirst({ where: { id: entryId, userId } });
    if (!existing) throw new AppError(404, 'Entrada de água não encontrada');
    return prisma.waterEntry.update({ where: { id: entryId }, data });
  },

  async deleteWaterEntry(userId: string, entryId: string) {
    const existing = await prisma.waterEntry.findFirst({ where: { id: entryId, userId } });
    if (!existing) throw new AppError(404, 'Entrada de água não encontrada');
    await prisma.waterEntry.delete({ where: { id: entryId } });
  },

  async consumeWaterEntry(userId: string, entryId: string) {
    return this.updateWaterEntry(userId, entryId, {
      status: 'consumed',
      consumedAt: new Date().toISOString(),
    });
  },

  async unconsumeWaterEntry(userId: string, entryId: string) {
    return this.updateWaterEntry(userId, entryId, { status: 'planned', consumedAt: undefined });
  },

  // ─── Daily Goals ────────────────────────────────────────────────────────────

  async getDailyGoals(userId: string) {
    const goals = await prisma.nutritionGoals.findUnique({ where: { userId } });
    if (!goals) return DEFAULT_GOALS;
    return {
      calories: goals.calories,
      protein: goals.protein,
      carbs: goals.carbs,
      fat: goals.fat,
      water: goals.water,
    };
  },

  async updateDailyGoals(userId: string, data: UpdateDailyGoalsInput) {
    await prisma.nutritionGoals.upsert({
      where: { userId },
      update: data,
      create: { userId, ...DEFAULT_GOALS, ...data },
    });
    return this.getDailyGoals(userId);
  },

  // ─── Predefined Foods ───────────────────────────────────────────────────────

  async listPredefinedFoods(filters: { category?: string; search?: string }, userId?: string) {
    if (filters.search) {
      // Accent-insensitive, multi-word search using the unaccent extension.
      // $queryRawUnsafe is used (instead of tagged template literals) to avoid
      // Prisma's internal parameter-numbering issues with conditional SQL fragments.
      // The SQL string itself contains no user-interpolated values — all input
      // goes through the parameterised values array, so injection is not possible.
      const words = filters.search.trim().split(/\s+/).filter((w) => w.length > 0);
      if (words.length === 0) return [];

      const terms = words.map((w) => `%${w}%`);

      // Each word must appear somewhere in the (unaccented, lowercased) name
      const wordClauses = words
        .map((_, i) => `unaccent(lower(name)) LIKE unaccent(lower($${i + 1}))`)
        .join(' AND ');

      const SELECT = `SELECT id, name, category, calories, protein, carbs, fat, "servingSize", "servingUnit", micronutrients, "createdBy" FROM "PredefinedFood"`;
      const ORDER = `ORDER BY name ASC LIMIT 100`;

      type RawFood = { id: string; name: string; category: string | null; calories: unknown; protein: unknown; carbs: unknown; fat: unknown; servingSize: unknown; servingUnit: string | null; micronutrients: unknown; createdBy: string | null };

      let rows: RawFood[];
      if (userId) {
        const uidParam = `$${words.length + 1}`;
        rows = await prisma.$queryRawUnsafe<RawFood[]>(
          `${SELECT} WHERE ("createdBy" IS NULL OR "createdBy" = ${uidParam}) AND ${wordClauses} ${ORDER}`,
          ...terms, userId,
        );
      } else {
        rows = await prisma.$queryRawUnsafe<RawFood[]>(
          `${SELECT} WHERE "createdBy" IS NULL AND ${wordClauses} ${ORDER}`,
          ...terms,
        );
      }

      // Number() cast: $queryRawUnsafe may return Decimal objects for Float cols
      return rows.map((r) => ({
        ...r,
        calories: Number(r.calories),
        protein: Number(r.protein),
        carbs: Number(r.carbs),
        fat: Number(r.fat),
        servingSize: r.servingSize != null ? Number(r.servingSize) : null,
      }));
    }

    return prisma.predefinedFood.findMany({
      where: {
        OR: [
          { createdBy: null },
          ...(userId ? [{ createdBy: userId }] : []),
        ],
        ...(filters.category ? { category: filters.category } : {}),
      },
      orderBy: { name: 'asc' },
    });
  },

  async getPredefinedFood(foodId: string) {
    const food = await prisma.predefinedFood.findUnique({ where: { id: foodId } });
    if (!food) throw new AppError(404, 'Alimento não encontrado');
    return food;
  },

  async createPredefinedFood(data: CreatePredefinedFoodInput, userId: string) {
    return prisma.predefinedFood.create({ data: { ...data, createdBy: userId } });
  },

  async updatePredefinedFood(foodId: string, data: Partial<CreatePredefinedFoodInput>, userId: string) {
    const existing = await prisma.predefinedFood.findFirst({
      where: { id: foodId, createdBy: userId },
    });
    if (!existing) throw new AppError(404, 'Alimento não encontrado ou sem permissão');
    return prisma.predefinedFood.update({ where: { id: foodId }, data });
  },

  async deletePredefinedFood(foodId: string, userId: string) {
    const existing = await prisma.predefinedFood.findFirst({
      where: { id: foodId, createdBy: userId },
    });
    if (!existing) throw new AppError(404, 'Alimento não encontrado ou sem permissão');
    await prisma.predefinedFood.delete({ where: { id: foodId } });
  },

  // ─── Stats ──────────────────────────────────────────────────────────────────

  async getStatsSummary(userId: string, startDate: string, endDate: string) {
    const [foodEntries, waterEntries, goals] = await Promise.all([
      prisma.foodEntry.findMany({
        where: { userId, date: { gte: startDate, lte: endDate }, status: 'consumed' },
      }),
      prisma.waterEntry.findMany({
        where: { userId, date: { gte: startDate, lte: endDate }, status: 'consumed' },
      }),
      this.getDailyGoals(userId),
    ]);

    const totalCalories = foodEntries.reduce((s, e) => s + e.calories, 0);
    const totalProtein = foodEntries.reduce((s, e) => s + e.protein, 0);
    const totalCarbs = foodEntries.reduce((s, e) => s + e.carbs, 0);
    const totalFat = foodEntries.reduce((s, e) => s + e.fat, 0);
    const totalWater = waterEntries.reduce((s, e) => s + e.amount, 0);

    const trackedDates = new Set([
      ...foodEntries.map((e) => e.date),
      ...waterEntries.map((e) => e.date),
    ]);
    const daysTracked = trackedDates.size;
    const totalDays =
      Math.round(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
      ) + 1;

    return {
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      totalWater,
      averageCaloriesPerDay: daysTracked > 0 ? Math.round(totalCalories / daysTracked) : 0,
      daysTracked,
      adherenceRate: totalDays > 0 ? Math.round((daysTracked / totalDays) * 100) : 0,
      goals,
    };
  },

  // ─── Diet Plan ──────────────────────────────────────────────────────────────

  async listDietPlan(userId: string) {
    return prisma.dietPlanItem.findMany({
      where: { userId },
      orderBy: [{ meal: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  },

  async createDietPlanItem(userId: string, data: CreateDietPlanItemInput) {
    return prisma.dietPlanItem.create({ data: { ...data, userId } });
  },

  async updateDietPlanItem(userId: string, itemId: string, data: UpdateDietPlanItemInput) {
    const existing = await prisma.dietPlanItem.findFirst({ where: { id: itemId, userId } });
    if (!existing) throw new AppError(404, 'Item do plano não encontrado');
    return prisma.dietPlanItem.update({ where: { id: itemId }, data });
  },

  async deleteDietPlanItem(userId: string, itemId: string) {
    const existing = await prisma.dietPlanItem.findFirst({ where: { id: itemId, userId } });
    if (!existing) throw new AppError(404, 'Item do plano não encontrado');
    await prisma.dietPlanItem.delete({ where: { id: itemId } });
  },

  async consumeDietPlanItem(userId: string, itemId: string, date: string) {
    const item = await prisma.dietPlanItem.findFirst({ where: { id: itemId, userId } });
    if (!item) throw new AppError(404, 'Item do plano não encontrado');
    // Idempotent: return existing if already consumed today
    const existing = await prisma.foodEntry.findFirst({
      where: { userId, dietPlanItemId: itemId, date },
    });
    if (existing) return existing;
    return prisma.foodEntry.create({
      data: {
        userId,
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        quantity: item.quantity,
        meal: item.meal,
        date,
        status: 'consumed',
        consumedAt: new Date().toISOString(),
        dietPlanItemId: itemId,
      },
    });
  },

  async unconsumeDietPlanItem(userId: string, itemId: string, date: string) {
    const existing = await prisma.foodEntry.findFirst({
      where: { userId, dietPlanItemId: itemId, date },
    });
    if (existing) {
      await prisma.foodEntry.delete({ where: { id: existing.id } });
    }
  },

  async getDailyProgress(userId: string, date: string) {
    const [foodEntries, waterEntries, goals] = await Promise.all([
      prisma.foodEntry.findMany({ where: { userId, date, status: 'consumed' } }),
      prisma.waterEntry.findMany({ where: { userId, date, status: 'consumed' } }),
      this.getDailyGoals(userId),
    ]);

    const consumed = { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 };
    foodEntries.forEach((e) => {
      consumed.calories += e.calories;
      consumed.protein += e.protein;
      consumed.carbs += e.carbs;
      consumed.fat += e.fat;
    });
    waterEntries.forEach((e) => { consumed.water += e.amount; });

    return {
      consumed,
      goals,
      progress: {
        calories: goals.calories > 0 ? Math.round((consumed.calories / goals.calories) * 100) : 0,
        protein: goals.protein > 0 ? Math.round((consumed.protein / goals.protein) * 100) : 0,
        carbs: goals.carbs > 0 ? Math.round((consumed.carbs / goals.carbs) * 100) : 0,
        fat: goals.fat > 0 ? Math.round((consumed.fat / goals.fat) * 100) : 0,
        water: goals.water > 0 ? Math.round((consumed.water / goals.water) * 100) : 0,
      },
    };
  },
};
