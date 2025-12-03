// src/components/NutritionTracker/NutritionOverview.tsx
import { useState, useEffect } from "react";
import { useNutritionContext } from "../../../../hooks/useNutritionContext";
import { useGoals } from "../../../../hooks/useGoals";
import WaterTracker from "../../components/WaterTracker";
import { CollapsibleMicronutrientReport } from "../../Reports/CollapsibleMicronutrientReport";
import type {
  FoodEntry,
  WaterEntry,
  Micronutrients,
} from "../../../../types/nutrition";
import type { UserGoals } from "../../../../types/goals";
import styles from "./NutritionOverview.module.css";

function NutritionOverview() {
  const { state, setSelectedDate, getEntriesByStatus, getWaterByStatus } =
    useNutritionContext();
  const { currentGoals } = useGoals();

  // ✅ TODOS OS useState DENTRO DO COMPONENTE
  const [goals, setGoals] = useState<UserGoals>(currentGoals);
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());

  // ✅ FUNÇÃO PARA TOGGLE DE EXPANSÃO
  const toggleMealExpansion = (mealType: string) => {
    setExpandedMeals((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(mealType)) {
        newSet.delete(mealType);
      } else {
        newSet.add(mealType);
      }
      return newSet;
    });
  };

  // ✅ ESCUTAR MUDANÇAS NAS METAS
  useEffect(() => {
    setGoals(currentGoals);
  }, [currentGoals]);

  // ✅ ESCUTAR EVENTO PERSONALIZADO DE ATUALIZAÇÃO
  useEffect(() => {
    const handleGoalsUpdate = (event: CustomEvent) => {
      setGoals(event.detail);
    };

    window.addEventListener("goalsUpdated", handleGoalsUpdate as EventListener);

    return () => {
      window.removeEventListener(
        "goalsUpdated",
        handleGoalsUpdate as EventListener
      );
    };
  }, []);

  // ✅ FUNÇÕES DE DATA CORRIGIDAS
  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(today.getDate()).padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const navigateDate = (direction: "prev" | "next") => {
    const [year, month, day] = state.selectedDate.split("-").map(Number);
    const currentDate = new Date(year, month - 1, day);

    if (direction === "prev") {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const todayString = getTodayString();
    const newDateString = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

    if (newDateString <= todayString) {
      setSelectedDate(newDateString);
    }
  };

  const isToday = state.selectedDate === getTodayString();
  const isFutureDate = state.selectedDate > getTodayString();

  // ✅ DADOS CALCULADOS - VERSÃO LIMPA
  const todayConsumedEntries = getEntriesByStatus("consumed");
  const todayPlannedEntries = getEntriesByStatus("planned");
  const consumedWaterEntries = getWaterByStatus("consumed");

  const todayTotals = todayConsumedEntries.reduce(
    (
      total: { calories: number; protein: number; carbs: number; fat: number },
      entry: FoodEntry
    ) => ({
      calories: total.calories + entry.calories,
      protein: total.protein + entry.protein,
      carbs: total.carbs + entry.carbs,
      fat: total.fat + entry.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const todayMicronutrients: Micronutrients = {};
  todayConsumedEntries.forEach((entry: FoodEntry) => {
    if (entry.micronutrients) {
      Object.entries(entry.micronutrients).forEach(([key, value]) => {
        if (typeof value === "number" && value > 0) {
          const nutrientKey = key as keyof Micronutrients;
          const currentValue =
            (todayMicronutrients[nutrientKey] as number) || 0;
          todayMicronutrients[nutrientKey] =
            currentValue + (value * entry.quantity) / 100;
        }
      });
    }
  });

  const todayWater = consumedWaterEntries.reduce(
    (total: number, entry: WaterEntry) => total + entry.amount,
    0
  );

  // ✅ APENAS AS PORCENTAGENS NECESSÁRIAS PARA OS MACROS
  const caloriesPercent = Math.min(
    (todayTotals.calories / goals.calories) * 100,
    100
  );
  const proteinPercent = Math.min(
    (todayTotals.protein / goals.protein) * 100,
    100
  );
  const carbsPercent = Math.min((todayTotals.carbs / goals.carbs) * 100, 100);
  const fatPercent = Math.min((todayTotals.fat / goals.fat) * 100, 100);

  const mealsSummary = [
    { name: "Café da Manhã", meal: "breakfast" as const, icon: "🌅" },
    { name: "Almoço", meal: "lunch" as const, icon: "🌞" },
    { name: "Jantar", meal: "dinner" as const, icon: "🌙" },
    { name: "Lanches", meal: "snack" as const, icon: "🍎" },
  ].map((mealInfo) => {
    const consumedMealEntries = todayConsumedEntries.filter(
      (entry: FoodEntry) => entry.meal === mealInfo.meal
    );
    const plannedMealEntries = todayPlannedEntries.filter(
      (entry: FoodEntry) => entry.meal === mealInfo.meal
    );

    const consumedCalories = consumedMealEntries.reduce(
      (sum: number, entry: FoodEntry) => sum + entry.calories,
      0
    );
    const plannedCalories = plannedMealEntries.reduce(
      (sum: number, entry: FoodEntry) => sum + entry.calories,
      0
    );

    return {
      ...mealInfo,
      consumedCalories: Math.round(consumedCalories),
      plannedCalories: Math.round(plannedCalories),
      consumedItems: consumedMealEntries.length,
      plannedItems: plannedMealEntries.length,
      totalItems: consumedMealEntries.length + plannedMealEntries.length,
      completionPercentage:
        plannedMealEntries.length > 0
          ? Math.round(
              (consumedMealEntries.length /
                (consumedMealEntries.length + plannedMealEntries.length)) *
                100
            )
          : consumedMealEntries.length > 0
          ? 100
          : 0,
    };
  });

  return (
    <div className={styles.nutritionOverview}>
      {/* ✅ NAVEGAÇÃO DE DATA */}
      <div className={styles.dateSelectorSection}>
        <div className={styles.dateNavigation}>
          <button
            className={styles.dateNavBtn}
            onClick={() => navigateDate("prev")}
            aria-label="Dia anterior"
          >
            ←
          </button>

          <div className={styles.dateDisplay}>
            <div
              className={`${styles.dateButton} ${isToday ? styles.today : ""}`}
            >
              <span className={styles.dateText}>
                {isToday ? "Hoje" : formatDate(state.selectedDate)}
              </span>
              <span className={styles.dateIcon}>📅</span>
            </div>
          </div>

          <button
            className={styles.dateNavBtn}
            onClick={() => navigateDate("next")}
            disabled={isFutureDate}
            aria-label="Próximo dia"
          >
            →
          </button>
        </div>
      </div>

      {/* ✅ BADGE PROFISSIONAL */}
      {goals.createdBy === "professional" && goals.professionalInfo && (
        <div className={styles.professionalBadge}>
          <div className={styles.professionalInfo}>
            <span className={styles.professionalIcon}>👨‍⚕️</span>
            <div className={styles.professionalDetails}>
              <div className={styles.professionalName}>
                Metas definidas por:{" "}
                <strong>{goals.professionalInfo.name}</strong>
              </div>
              {goals.professionalInfo.license && (
                <div className={styles.professionalLicense}>
                  {goals.professionalInfo.license}
                </div>
              )}
              {goals.professionalInfo.notes && (
                <div className={styles.professionalNotes}>
                  "{goals.professionalInfo.notes}"
                </div>
              )}
              <div className={styles.professionalValidity}>
                Válido desde:{" "}
                {new Date(goals.validFrom).toLocaleDateString("pt-BR")}
                {goals.validUntil && (
                  <span>
                    {" "}
                    até {new Date(goals.validUntil).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {goals.createdBy === "user" && (
        <div className={styles.goalsIndicator}>
          <div className={styles.goalsInfo}>
            <span className={styles.goalsIcon}>🎯</span>
            <div className={styles.goalsText}>
              <span>Metas personalizadas ativas</span>
              <small>
                Última atualização:{" "}
                {new Date(goals.createdAt).toLocaleDateString("pt-BR")}
              </small>
            </div>
          </div>
        </div>
      )}

      {/* ✅ RESUMO DIÁRIO COM MACRONUTRIENTES INTEGRADOS */}
      <div className={styles.dailySummaryCard}>
        <h3>📊 Resumo do Dia</h3>

        {/* ✅ MACRONUTRIENTES EM GRID 2x2 COM BARRAS E FORMATO ATUAL/META */}
        <div className={styles.dailyMacrosSection}>
          <h4 className={styles.macrosSectionTitle}>🥗 Macronutrientes</h4>
          <div className={styles.dailyMacrosGrid}>
            {/* Calorias */}
            <div className={`${styles.dailyMacroCard} ${styles.calories}`}>
              <div className={styles.macroIcon}>🔥</div>
              <div className={styles.macroContent}>
                <span className={styles.macroLabel}>Calorias</span>
                <span className={styles.macroValue}>
                  {Math.round(todayTotals.calories)} / {goals.calories} kcal
                </span>
                <div className={styles.macroBar}>
                  <div
                    className={`${styles.macroFill} ${styles.caloriesFill}`}
                    style={{ width: `${Math.min(caloriesPercent, 100)}%` }}
                  />
                </div>
                <small className={styles.macroProgress}>
                  {Math.round(caloriesPercent)}% da meta
                </small>
              </div>
            </div>

            {/* Proteína */}
            <div className={`${styles.dailyMacroCard} ${styles.protein}`}>
              <div className={styles.macroIcon}>🥩</div>
              <div className={styles.macroContent}>
                <span className={styles.macroLabel}>Proteína</span>
                <span className={styles.macroValue}>
                  {todayTotals.protein.toFixed(1)} / {goals.protein}g
                </span>
                <div className={styles.macroBar}>
                  <div
                    className={`${styles.macroFill} ${styles.proteinFill}`}
                    style={{ width: `${Math.min(proteinPercent, 100)}%` }}
                  />
                </div>
                <small className={styles.macroProgress}>
                  {Math.round(proteinPercent)}% da meta
                </small>
              </div>
            </div>

            {/* Carboidratos */}
            <div className={`${styles.dailyMacroCard} ${styles.carbs}`}>
              <div className={styles.macroIcon}>🍞</div>
              <div className={styles.macroContent}>
                <span className={styles.macroLabel}>Carboidratos</span>
                <span className={styles.macroValue}>
                  {todayTotals.carbs.toFixed(1)} / {goals.carbs}g
                </span>
                <div className={styles.macroBar}>
                  <div
                    className={`${styles.macroFill} ${styles.carbsFill}`}
                    style={{ width: `${Math.min(carbsPercent, 100)}%` }}
                  />
                </div>
                <small className={styles.macroProgress}>
                  {Math.round(carbsPercent)}% da meta
                </small>
              </div>
            </div>

            {/* Gorduras */}
            <div className={`${styles.dailyMacroCard} ${styles.fat}`}>
              <div className={styles.macroIcon}>🥑</div>
              <div className={styles.macroContent}>
                <span className={styles.macroLabel}>Gorduras</span>
                <span className={styles.macroValue}>
                  {todayTotals.fat.toFixed(1)} / {goals.fat}g
                </span>
                <div className={styles.macroBar}>
                  <div
                    className={`${styles.macroFill} ${styles.fatFill}`}
                    style={{ width: `${Math.min(fatPercent, 100)}%` }}
                  />
                </div>
                <small className={styles.macroProgress}>
                  {Math.round(fatPercent)}% da meta
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ RESUMO DAS REFEIÇÕES SIMPLIFICADO */}
      <div className={styles.mealsSummaryCard}>
        <h3>🍽️ Refeições</h3>
        <div className={styles.mealsQuickSummary}>
          {mealsSummary.map((meal) => {
            const isExpanded = expandedMeals.has(meal.meal);
            const totalCalories = meal.consumedCalories + meal.plannedCalories;

            return (
              <div key={meal.meal} className={styles.mealSummaryItem}>
                {/* ✅ HEADER CLICÁVEL */}
                <button
                  className={`${styles.mealHeader} ${
                    isExpanded ? styles.expanded : styles.collapsed
                  }`}
                  onClick={() => toggleMealExpansion(meal.meal)}
                  type="button"
                >
                  <div className={styles.mealHeaderContent}>
                    <div className={styles.mealName}>
                      {meal.icon} {meal.name}
                    </div>
                    <div className={styles.mealSummaryInfo}>
                      <span className={styles.mealCalories}>
                        {totalCalories} kcal
                      </span>
                      {meal.totalItems > 0 && (
                        <span className={styles.mealItemCount}>
                          {meal.totalItems}{" "}
                          {meal.totalItems === 1 ? "item" : "itens"}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`${styles.mealArrow} ${
                      isExpanded ? styles.expanded : styles.collapsed
                    }`}
                  >
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </button>

                {/* ✅ CONTEÚDO EXPANSÍVEL SIMPLIFICADO - APENAS TOTAIS */}
                {isExpanded && (
                  <div className={styles.mealExpandedContent}>
                    {/* ✅ APENAS O TOTAL DA REFEIÇÃO */}
                    <div className={styles.mealTotalSummary}>
                      <h4 className={styles.mealTotalTitle}>
                        📊 Total da Refeição
                      </h4>

                      <div className={styles.mealTotalGrid}>
                        {/* Calorias */}
                        <div className={styles.mealTotalItem}>
                          <div className={styles.nutrientIcon}>🔥</div>
                          <span className={styles.mealTotalLabel}>
                            Calorias
                          </span>
                          <span className={styles.mealTotalValue}>
                            {totalCalories} kcal
                          </span>
                        </div>

                        {/* Proteínas */}
                        <div className={styles.mealTotalItem}>
                          <div className={styles.nutrientIcon}>🥩</div>
                          <span className={styles.mealTotalLabel}>
                            Proteína
                          </span>
                          <span className={styles.mealTotalValue}>
                            {(
                              todayConsumedEntries
                                .filter(
                                  (entry: FoodEntry) => entry.meal === meal.meal
                                )
                                .reduce(
                                  (sum: number, entry: FoodEntry) =>
                                    sum + entry.protein,
                                  0
                                ) +
                              todayPlannedEntries
                                .filter(
                                  (entry: FoodEntry) => entry.meal === meal.meal
                                )
                                .reduce(
                                  (sum: number, entry: FoodEntry) =>
                                    sum + entry.protein,
                                  0
                                )
                            ).toFixed(1)}
                            g
                          </span>
                        </div>

                        {/* Carboidratos */}
                        <div className={styles.mealTotalItem}>
                          <div className={styles.nutrientIcon}>🍞</div>
                          <span className={styles.mealTotalLabel}>
                            Carboidratos
                          </span>
                          <span className={styles.mealTotalValue}>
                            {(
                              todayConsumedEntries
                                .filter(
                                  (entry: FoodEntry) => entry.meal === meal.meal
                                )
                                .reduce(
                                  (sum: number, entry: FoodEntry) =>
                                    sum + entry.carbs,
                                  0
                                ) +
                              todayPlannedEntries
                                .filter(
                                  (entry: FoodEntry) => entry.meal === meal.meal
                                )
                                .reduce(
                                  (sum: number, entry: FoodEntry) =>
                                    sum + entry.carbs,
                                  0
                                )
                            ).toFixed(1)}
                            g
                          </span>
                        </div>

                        {/* Gorduras */}
                        <div className={styles.mealTotalItem}>
                          <div className={styles.nutrientIcon}>🥑</div>
                          <span className={styles.mealTotalLabel}>
                            Gorduras
                          </span>
                          <span className={styles.mealTotalValue}>
                            {(
                              todayConsumedEntries
                                .filter(
                                  (entry: FoodEntry) => entry.meal === meal.meal
                                )
                                .reduce(
                                  (sum: number, entry: FoodEntry) =>
                                    sum + entry.fat,
                                  0
                                ) +
                              todayPlannedEntries
                                .filter(
                                  (entry: FoodEntry) => entry.meal === meal.meal
                                )
                                .reduce(
                                  (sum: number, entry: FoodEntry) =>
                                    sum + entry.fat,
                                  0
                                )
                            ).toFixed(1)}
                            g
                          </span>
                        </div>
                      </div>

                      {/* Status da refeição */}
                      <div className={styles.mealStatusSummary}>
                        <div
                          className={`${styles.mealStatusItem} ${styles.consumed}`}
                        >
                          <span className={styles.statusIcon}>✅</span>
                          <span className={styles.statusText}>
                            {meal.consumedItems} consumido
                            {meal.consumedItems !== 1 ? "s" : ""}
                          </span>
                          <span className={styles.statusCalories}>
                            {meal.consumedCalories} kcal
                          </span>
                        </div>

                        {meal.plannedItems > 0 && (
                          <div
                            className={`${styles.mealStatusItem} ${styles.planned}`}
                          >
                            <span className={styles.statusIcon}>⏳</span>
                            <span className={styles.statusText}>
                              {meal.plannedItems} planejado
                              {meal.plannedItems !== 1 ? "s" : ""}
                            </span>
                            <span className={styles.statusCalories}>
                              {meal.plannedCalories} kcal
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Barra de progresso */}
                      {meal.totalItems > 0 && (
                        <div className={styles.mealProgressSection}>
                          <div className={styles.progressLabel}>
                            <span>Progresso da refeição</span>
                            <span className={styles.progressPercentage}>
                              {meal.completionPercentage}%
                            </span>
                          </div>
                          <div className={styles.progressBarContainer}>
                            <div className={styles.progressBarTrack}>
                              <div
                                className={styles.progressBarFill}
                                style={{
                                  width: `${meal.completionPercentage}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mensagem quando não há itens */}
                      {meal.totalItems === 0 && (
                        <div className={styles.emptyMealMessage}>
                          <span>Nenhum alimento adicionado ainda</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <WaterTracker current={todayWater} goal={goals.water} />

      <CollapsibleMicronutrientReport
        todayMicronutrients={todayMicronutrients}
        customGoals={goals.micronutrients}
      />
    </div>
  );
}

export default NutritionOverview;
