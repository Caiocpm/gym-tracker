// src/hooks/useNutritionHistory.ts

import { useState, useEffect, useCallback } from "react";
import type {
  NutritionHistory,
  DailySummaryRecord,
  MealPlan,
  Achievement,
  StreakData,
  DailyGoals,
} from "../types/nutrition";

const STORAGE_KEY = "nutrition-history";

// Achievements predefinidos
const PREDEFINED_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-day-complete",
    name: "Primeiro Dia Completo",
    description: "Complete 100% das suas metas de nutrição em um dia!",
    icon: "🎯",
    unlockedAt: null,
    type: "completion",
  },
  {
    id: "week-streak",
    name: "Semana Perfeita",
    description: "Complete 7 dias consecutivos de metas!",
    icon: "🔥",
    unlockedAt: null,
    type: "streak",
  },
  {
    id: "month-streak",
    name: "Mês Dedicado",
    description: "Complete 30 dias consecutivos de metas!",
    icon: "👑",
    unlockedAt: null,
    type: "streak",
  },
  {
    id: "protein-master",
    name: "Mestre das Proteínas",
    description: "Atinja a meta de proteína por 10 dias seguidos!",
    icon: "💪",
    unlockedAt: null,
    type: "nutrition",
  },
  {
    id: "water-champion",
    name: "Campeão da Hidratação",
    description: "Beba toda a água recomendada por 5 dias seguidos!",
    icon: "💧",
    unlockedAt: null,
    type: "nutrition",
  },
];

// Estado inicial padrão para o histórico
const defaultHistory: NutritionHistory = {
  dailyRecords: {},
  mealPlans: [],
  activeMealPlanId: null,
  achievements: PREDEFINED_ACHIEVEMENTS.map((a) => ({
    ...a,
    unlockedAt: null,
  })),
  streaks: {
    current: 0,
    longest: 0,
    lastCompletedDate: null,
  },
};

export function useNutritionHistory() {
  const [history, setHistory] = useState<NutritionHistory>(defaultHistory);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados do localStorage ao iniciar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedHistory: NutritionHistory = JSON.parse(stored);
        // Mesclar achievements para garantir que novos achievements sejam adicionados
        const mergedAchievements = PREDEFINED_ACHIEVEMENTS.map((predef) => {
          const existing = parsedHistory.achievements.find(
            (a) => a.id === predef.id
          );
          return existing ? existing : { ...predef, unlockedAt: null };
        });
        setHistory({ ...parsedHistory, achievements: mergedAchievements });
      } else {
        setHistory(defaultHistory);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultHistory));
      }
    } catch (error) {
      console.error("Erro ao carregar histórico de nutrição:", error);
      setHistory(defaultHistory);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Salvar no localStorage sempre que o histórico mudar (após o carregamento inicial)
  useEffect(() => {
    if (!isLoading) {
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = history.dailyRecords[today];

      console.log("💾 Saving nutrition-history to localStorage");
      if (todayRecord) {
        console.log("   Today's record has", todayRecord.entries.length, "entries");
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  }, [history, isLoading]);

  // ==========================================================================
  //                                 HELPERS
  // ==========================================================================

  const getCurrentDate = (): string => {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  };

  const getToday = useCallback(() => {
    return getCurrentDate();
  }, []);

  // ==========================================================================
  //                                 DAILY RECORDS
  // ==========================================================================

  const getDailySummaryRecord = useCallback(
    (date: string): DailySummaryRecord | null => {
      return history.dailyRecords[date] || null;
    },
    [history.dailyRecords]
  );

  // Calcular streak atual
  const calculateCurrentStreak = useCallback(
    (dailyRecords: Record<string, DailySummaryRecord>): StreakData => {
      const dates = Object.keys(dailyRecords).sort(); // Ordenar do mais antigo para o mais novo (YYYY-MM-DD)
      let currentStreak = 0;
      let lastCompletedDate: string | null = null;
      let previousDateStr: string | null = null;

      for (let i = dates.length - 1; i >= 0; i--) {
        // Iterar do mais recente para o mais antigo
        const dateStr = dates[i];
        const record = dailyRecords[dateStr];

        if (record.isCompleted) {
          // Se é o primeiro dia completado ou é consecutivo ao anterior
          if (!previousDateStr || isConsecutiveDay(dateStr, previousDateStr)) {
            currentStreak++;
            lastCompletedDate = dateStr;
            previousDateStr = dateStr;
          } else {
            // Quebra a sequência se não for consecutivo
            break;
          }
        } else {
          // Se o dia mais recente não está completo, a sequência é 0
          if (i === dates.length - 1) {
            currentStreak = 0;
            lastCompletedDate = null;
          }
          break; // Quebra a sequência
        }
      }
      return { current: currentStreak, longest: 0, lastCompletedDate }; // Longest será atualizado no setHistory
    },
    []
  );

  // Helper: Verificar se duas datas são dias consecutivos
  const isConsecutiveDay = (currentDateStr: string, previousDateStr: string): boolean => {
    const current = new Date(currentDateStr + "T00:00:00");
    const previous = new Date(previousDateStr + "T00:00:00");
    const diffInMs = previous.getTime() - current.getTime();
    const diffInDays = Math.round(diffInMs / (24 * 60 * 60 * 1000));
    return diffInDays === 1; // Previous deve ser 1 dia depois de current (pois iteramos do mais recente)
  };

  // Calcula a sequência de um nutriente específico
  const calculateNutrientStreak = useCallback(
    (
      dailyRecords: Record<string, DailySummaryRecord>,
      condition: (record: DailySummaryRecord, goals: DailyGoals) => boolean
    ): number => {
      const dates = Object.keys(dailyRecords).sort().reverse(); // Mais recente primeiro
      let streak = 0;
      for (const date of dates) {
        const record = dailyRecords[date];
        if (record && record.goals && condition(record, record.goals)) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    },
    []
  );

  // Verificar e desbloquear achievements
  const checkAchievements = useCallback(
    (currentHistory: NutritionHistory): NutritionHistory => {
      const today = getToday();
      const todayRecord = currentHistory.dailyRecords[today];

      if (!todayRecord) return currentHistory;

      const updatedHistory = { ...currentHistory };
      const updatedAchievements = [...updatedHistory.achievements];

      // Achievement: Primeiro Dia Completo
      const firstDayAchievement = updatedAchievements.find(
        (a) => a.id === "first-day-complete"
      );
      if (
        firstDayAchievement &&
        !firstDayAchievement.unlockedAt &&
        todayRecord.isCompleted
      ) {
        firstDayAchievement.unlockedAt = new Date().toISOString();
      }

      // Calcular streak atual
      const {
        current: newCurrentStreak,
        lastCompletedDate: newLastCompletedDate,
      } = calculateCurrentStreak(currentHistory.dailyRecords);
      updatedHistory.streaks = {
        current: newCurrentStreak,
        longest: Math.max(newCurrentStreak, updatedHistory.streaks.longest),
        lastCompletedDate: newLastCompletedDate,
      };

      // Achievement: Semana Perfeita
      const weekAchievement = updatedAchievements.find(
        (a) => a.id === "week-streak"
      );
      if (
        weekAchievement &&
        !weekAchievement.unlockedAt &&
        updatedHistory.streaks.current >= 7
      ) {
        weekAchievement.unlockedAt = new Date().toISOString();
      }

      // Achievement: Mês Dedicado
      const monthAchievement = updatedAchievements.find(
        (a) => a.id === "month-streak"
      );
      if (
        monthAchievement &&
        !monthAchievement.unlockedAt &&
        updatedHistory.streaks.current >= 30
      ) {
        monthAchievement.unlockedAt = new Date().toISOString();
      }

      // Achievement: Mestre das Proteínas
      const proteinMasterAchievement = updatedAchievements.find(
        (a) => a.id === "protein-master"
      );
      if (proteinMasterAchievement && !proteinMasterAchievement.unlockedAt) {
        const proteinStreak = calculateNutrientStreak(
          currentHistory.dailyRecords,
          (record, goals) => record.totals.protein >= goals.protein
        );
        if (proteinStreak >= 10) {
          proteinMasterAchievement.unlockedAt = new Date().toISOString();
        }
      }

      // Achievement: Campeão da Hidratação
      const waterChampionAchievement = updatedAchievements.find(
        (a) => a.id === "water-champion"
      );
      if (waterChampionAchievement && !waterChampionAchievement.unlockedAt) {
        const waterStreak = calculateNutrientStreak(
          currentHistory.dailyRecords,
          (record, goals) => record.totals.water >= goals.water
        );
        if (waterStreak >= 5) {
          waterChampionAchievement.unlockedAt = new Date().toISOString();
        }
      }

      updatedHistory.achievements = updatedAchievements;
      return updatedHistory;
    },
    [getToday, calculateCurrentStreak, calculateNutrientStreak]
  );

  // Função para atualizar o registro diário (chamada pelo NutritionContext)
  const updateDailySummaryRecord = useCallback(
    (record: DailySummaryRecord) => {
      console.log("📝 updateDailySummaryRecord called for date:", record.date);
      console.log("   Entries in record:", record.entries.length);
      console.log("   Entry names:", record.entries.map(e => e.name));

      setHistory((prev) => {
        const newHistory = {
          ...prev,
          dailyRecords: {
            ...prev.dailyRecords,
            [record.date]: record,
          },
        };
        // Após atualizar o registro, verificar achievements e streaks
        return checkAchievements(newHistory);
      });
    },
    [checkAchievements]
  );

  // ==========================================================================
  //                                 MEAL PLANS
  // ==========================================================================

  const createMealPlan = useCallback(
    (
      plan: Omit<MealPlan, "id" | "createdAt" | "lastUpdated" | "isActive">
    ): MealPlan => {
      const now = new Date().toISOString();
      const newPlan: MealPlan = {
        ...plan,
        id: `plan_${Date.now()}`,
        createdAt: now,
        lastUpdated: now,
        isActive: false, // Será ativado explicitamente
      };

      setHistory((prev) => ({
        ...prev,
        mealPlans: [...prev.mealPlans, newPlan],
        activeMealPlanId: prev.activeMealPlanId || newPlan.id, // Ativa o primeiro plano criado
      }));

      return newPlan;
    },
    []
  );

  const setActiveMealPlan = useCallback((planId: string) => {
    setHistory((prev) => ({
      ...prev,
      mealPlans: prev.mealPlans.map((plan) => ({
        ...plan,
        isActive: plan.id === planId,
      })),
      activeMealPlanId: planId,
    }));
  }, []);

  const getActiveMealPlan = useCallback((): MealPlan | null => {
    return (
      history.mealPlans.find((plan) => plan.id === history.activeMealPlanId) ||
      null
    );
  }, [history.mealPlans, history.activeMealPlanId]);

  const addFoodToMealPlanTemplate = useCallback(
    (
      planId: string,
      foodTemplate: Omit<
        import("../types/nutrition").FoodEntry,
        "id" | "date" | "time" | "status" | "consumedAt" | "plannedAt"
      >
    ) => {
      setHistory((prev) => ({
        ...prev,
        mealPlans: prev.mealPlans.map((plan) =>
          plan.id === planId
            ? {
                ...plan,
                plannedFoodTemplates: [
                  ...plan.plannedFoodTemplates,
                  foodTemplate,
                ],
                lastUpdated: new Date().toISOString(),
              }
            : plan
        ),
      }));
    },
    []
  );

  const removeFoodFromMealPlanTemplate = useCallback(
    (planId: string, foodName: string, meal: import("../types/nutrition").MealType) => {
      setHistory((prev) => ({
        ...prev,
        mealPlans: prev.mealPlans.map((plan) =>
          plan.id === planId
            ? {
                ...plan,
                plannedFoodTemplates: plan.plannedFoodTemplates.filter(
                  (template) =>
                    !(template.name === foodName && template.meal === meal)
                ),
                lastUpdated: new Date().toISOString(),
              }
            : plan
        ),
      }));
    },
    []
  );

  // ==========================================================================
  //                                 STATS
  // ==========================================================================

  const getHistoryStats = useCallback(() => {
    const completedDays = Object.values(history.dailyRecords).filter(
      (p) => p.isCompleted
    ).length;
    const totalDays = Object.keys(history.dailyRecords).length;
    const completionRate =
      totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

    return {
      completedDays,
      totalDays,
      completionRate: Math.round(completionRate),
      currentStreak: history.streaks.current,
      longestStreak: history.streaks.longest,
      unlockedAchievements: history.achievements.filter((a) => a.unlockedAt)
        .length,
      totalAchievements: history.achievements.length,
    };
  }, [history]);

  const getAchievements = useCallback(() => {
    return history.achievements;
  }, [history.achievements]);

  return {
    // Estado
    history,
    isLoading,

    // Daily Records
    getDailySummaryRecord,
    updateDailySummaryRecord,

    // Meal Plans
    createMealPlan,
    setActiveMealPlan,
    getActiveMealPlan,
    addFoodToMealPlanTemplate,
    removeFoodFromMealPlanTemplate,

    // Gamification & Stats
    getHistoryStats,
    getAchievements,

    // Dados diretos
    streaks: history.streaks,
    mealPlans: history.mealPlans,
    activeMealPlanId: history.activeMealPlanId,
  };
}
