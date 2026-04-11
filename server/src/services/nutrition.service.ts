import prisma from '../config/database';
import { AppError } from '../types/api.types';
import { expandSearchTerms } from '../config/food-synonyms';
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

const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 250, fat: 65, fiber: 25, water: 2500 };

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
        fiber: d.fiber ?? (d.micronutrients as any)?.fiber_g ?? 0,
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
    if (!goals) return { ...DEFAULT_GOALS, weightGoal: null, weightGoalStart: null };
    return {
      calories: goals.calories,
      protein: goals.protein,
      carbs: goals.carbs,
      fat: goals.fat,
      fiber: goals.fiber,
      water: goals.water,
      weightGoal: goals.weightGoal ?? null,
      weightGoalStart: goals.weightGoalStart ?? null,
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
      // ── Build parameterised query with synonym expansion + alias matching ──
      //
      // Strategy:
      //   1. Expand the raw search phrase via synonyms dict (e.g. "mussarela" → ["mussarela","mozarela"])
      //   2. For each expanded term, ALL its words must appear in the food name  (name clauses, OR'd between terms)
      //   3. Also OR the original phrase against the `aliases` array column      (covers DB-level aliases)
      //   4. Rank results: starts-with > exact-segment > anywhere/alias match
      //
      // $queryRawUnsafe is necessary to build conditional SQL; all values go
      // through the params array — no user strings are interpolated into the SQL.

      const rawInput = filters.search.trim();
      const expandedTerms = expandSearchTerms(rawInput);          // always includes rawInput

      if (expandedTerms.length === 0) return [];

      const params: (string | string[])[] = [];
      const push = (v: string | string[]) => { params.push(v); return params.length; };

      // ── 1. Name-match clauses (one per expanded term, OR'd) ──────────────────
      const nameOrClauses: string[] = [];
      for (const term of expandedTerms) {
        const words = term.split(/\s+/).filter((w) => w.length > 0);
        if (words.length === 0) continue;
        const andClauses = words.map((w) => {
          const idx = push(`%${w}%`);
          return `unaccent(lower(name)) LIKE unaccent(lower($${idx}))`;
        });
        nameOrClauses.push(`(${andClauses.join(' AND ')})`);
      }

      // ── 2. Alias-match clause (original phrase against aliases[] column) ─────
      //    One EXISTS per original word; all words must match at least one alias.
      const rawWords = rawInput.split(/\s+/).filter((w) => w.length > 0);
      const aliasClauses = rawWords.map((w) => {
        const idx = push(`%${w}%`);
        return `EXISTS (SELECT 1 FROM unnest(aliases) _a WHERE unaccent(lower(_a)) LIKE unaccent(lower($${idx})))`;
      });
      const aliasClause = `(${aliasClauses.join(' AND ')})`;

      const MATCH = `(${[...nameOrClauses, aliasClause].join(' OR ')})`;

      // ── 3. Ranking params (first word of raw input) ──────────────────────────
      const startIdx = push(`${rawWords[0]}%`);     // name begins with first word
      const exactIdx = push(rawWords[0]);            // first comma-segment = first word

      const SELECT = `SELECT id, name, category, calories, protein, carbs, fat, "servingSize", "servingUnit", micronutrients, "createdBy" FROM "PredefinedFood"`;

      type RawFood = { id: string; name: string; category: string | null; calories: unknown; protein: unknown; carbs: unknown; fat: unknown; servingSize: unknown; servingUnit: string | null; micronutrients: unknown; createdBy: string | null };

      const ORDER = `ORDER BY
        CASE
          WHEN unaccent(lower(name)) LIKE unaccent(lower($${startIdx})) THEN 1
          WHEN unaccent(lower(split_part(name, ',', 1))) = unaccent(lower($${exactIdx})) THEN 2
          ELSE 3
        END ASC, name ASC LIMIT 100`;

      let rows: RawFood[];
      if (userId) {
        const uidIdx = push(userId);
        rows = await prisma.$queryRawUnsafe<RawFood[]>(
          `${SELECT} WHERE ("createdBy" IS NULL OR "createdBy" = $${uidIdx}) AND ${MATCH} ${ORDER}`,
          ...params,
        );
      } else {
        rows = await prisma.$queryRawUnsafe<RawFood[]>(
          `${SELECT} WHERE "createdBy" IS NULL AND ${MATCH} ${ORDER}`,
          ...params,
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
    const totalFiber = foodEntries.reduce((s, e) => s + e.fiber, 0);
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
      totalFiber,
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

    const consumed = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, water: 0 };
    foodEntries.forEach((e) => {
      consumed.calories += e.calories;
      consumed.protein += e.protein;
      consumed.carbs += e.carbs;
      consumed.fat += e.fat;
      consumed.fiber += e.fiber;
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
        fiber: goals.fiber > 0 ? Math.round((consumed.fiber / goals.fiber) * 100) : 0,
        water: goals.water > 0 ? Math.round((consumed.water / goals.water) * 100) : 0,
      },
    };
  },
};
