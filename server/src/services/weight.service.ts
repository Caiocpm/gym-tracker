import prisma from '../config/database';
import { AppError } from '../types/api.types';

export const weightService = {
  async list(userId: string) {
    return prisma.weightEntry.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 52, // ~1 ano
    });
  },

  async upsert(userId: string, data: { weight: number; date: string; note?: string }) {
    // Upsert pela data (uma entrada por semana)
    const existing = await prisma.weightEntry.findFirst({
      where: { userId, date: data.date },
    });
    if (existing) {
      return prisma.weightEntry.update({
        where: { id: existing.id },
        data: { weight: data.weight, note: data.note ?? null },
      });
    }
    return prisma.weightEntry.create({
      data: { userId, ...data },
    });
  },

  async delete(userId: string, entryId: string) {
    const existing = await prisma.weightEntry.findFirst({ where: { id: entryId, userId } });
    if (!existing) throw new AppError(404, 'Registro não encontrado');
    await prisma.weightEntry.delete({ where: { id: entryId } });
  },

  // ─── Nutrition Stats ─────────────────────────────────────────────────────────────

  async getNutritionStats(userId: string) {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    const [foodEntries, goals, weightEntries] = await Promise.all([
      prisma.foodEntry.findMany({
        where: {
          userId,
          date: { gte: fmt(thirtyDaysAgo), lte: fmt(today) },
          status: 'consumed',
        },
      }),
      prisma.nutritionGoals.findUnique({ where: { userId } }),
      prisma.weightEntry.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
        take: 12,
      }),
    ]);

    const calGoal = goals?.calories ?? 2000;

    // Group by date
    const byDate = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>();
    for (const e of foodEntries) {
      const cur = byDate.get(e.date) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
      cur.calories += e.calories;
      cur.protein += e.protein;
      cur.carbs += e.carbs;
      cur.fat += e.fat;
      byDate.set(e.date, cur);
    }

    const trackedDays = [...byDate.values()];
    const daysCount = trackedDays.length;

    // Aderência: dias com >= 90% da meta de calorias
    const adherentDays = trackedDays.filter(d => d.calories >= calGoal * 0.9).length;
    const adherenceRate = daysCount > 0 ? Math.round((adherentDays / daysCount) * 100) : 0;

    // Streak: dias consecutivos até hoje com >= 90% meta
    let streak = 0;
    const check = new Date(today);
    while (true) {
      const key = fmt(check);
      const day = byDate.get(key);
      if (day && day.calories >= calGoal * 0.9) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else break;
    }

    // Maior streak nos últimos 30 dias
    let bestStreak = 0;
    let currentRun = 0;
    const sortedDates = [...byDate.keys()].sort();
    for (let i = 0; i < sortedDates.length; i++) {
      const day = byDate.get(sortedDates[i])!;
      if (day.calories >= calGoal * 0.9) {
        currentRun++;
        if (currentRun > bestStreak) bestStreak = currentRun;
      } else {
        currentRun = 0;
      }
    }

    // Distribuição de macros (média dos dias rastreados)
    const avgProtein = daysCount > 0 ? trackedDays.reduce((s, d) => s + d.protein, 0) / daysCount : 0;
    const avgCarbs = daysCount > 0 ? trackedDays.reduce((s, d) => s + d.carbs, 0) / daysCount : 0;
    const avgFat = daysCount > 0 ? trackedDays.reduce((s, d) => s + d.fat, 0) / daysCount : 0;
    const totalMacroG = avgProtein + avgCarbs + avgFat;
    const macroDistribution = totalMacroG > 0 ? {
      protein: Math.round((avgProtein / totalMacroG) * 100),
      carbs: Math.round((avgCarbs / totalMacroG) * 100),
      fat: Math.round((avgFat / totalMacroG) * 100),
    } : { protein: 0, carbs: 0, fat: 0 };

    // Balanço semanal (últimos 7 dias)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    const weekEntries = [...byDate.entries()]
      .filter(([d]) => d >= fmt(weekStart))
      .map(([, v]) => v);
    const weekConsumed = weekEntries.reduce((s, d) => s + d.calories, 0);
    const weekGoal = calGoal * 7;

    return {
      adherenceRate,
      adherentDays,
      trackedDays: daysCount,
      streak,
      bestStreak,
      macroDistribution,
      weekConsumed: Math.round(weekConsumed),
      weekGoal: Math.round(weekGoal),
      weightEntries: weightEntries.map(w => ({ id: w.id, weight: w.weight, date: w.date, note: w.note })),
    };
  },
};
