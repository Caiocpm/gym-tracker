// src/components/NutritionTracker/NutritionSummaryCards.tsx
import React from "react";
import { useNutritionContext } from "../../../../hooks/useNutritionContext";
import { useGoals } from "../../../../hooks/useGoals";
import type {
  FoodEntry,
  WaterEntry,
  Micronutrients,
} from "../../../../types/nutrition";
import { getMicronutrientUnit } from "../../../../utils/nutritionHelpers"; // ✅ Novo import
import styles from "./NutritionSummaryCards.module.css"; // Importa os estilos como um objeto

export const NutritionSummaryCards: React.FC = () => {
  const { state, getEntriesByStatus, getWaterByStatus } = useNutritionContext();
  const { currentGoals } = useGoals();

  const todayConsumedEntries = getEntriesByStatus("consumed");
  const todayPlannedEntries = getEntriesByStatus("planned");

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

  const consumedWaterEntries = getWaterByStatus("consumed"); // ✅ Movido para antes do uso
  const todayWater = consumedWaterEntries.reduce(
    (total: number, entry: WaterEntry) => total + entry.amount,
    0
  );

  // Calcula os percentuais para os macros e calorias
  const calculatePercentage = (consumed: number, goal: number) => {
    if (goal === 0) return 0;
    return Math.min((consumed / goal) * 100, 100);
  };

  const caloriesPercent = calculatePercentage(
    todayTotals.calories,
    currentGoals.calories
  );
  const proteinPercent = calculatePercentage(
    todayTotals.protein,
    currentGoals.protein
  );
  const carbsPercent = calculatePercentage(
    todayTotals.carbs,
    currentGoals.carbs
  );
  const fatPercent = calculatePercentage(todayTotals.fat, currentGoals.fat);
  const waterPercent = calculatePercentage(todayWater, currentGoals.water);

  // Micronutrientes (simplificado para exibição em cards)
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

  const hasDataForSelectedDay =
    todayConsumedEntries.length > 0 ||
    todayPlannedEntries.length > 0 ||
    consumedWaterEntries.length > 0;

  if (!hasDataForSelectedDay) {
    return (
      <div className={styles.nutritionSummaryEmpty}>
        <p>Nenhum dado de nutrição registrado para {state.selectedDate}.</p>
        <p>Adicione alimentos para ver o resumo!</p>
      </div>
    );
  }

  return (
    <div className={styles.nutritionSummaryCardsContainer}>
      {/* Card de Calorias */}
      <div className={`${styles.summaryCard} ${styles.caloriesCard}`}>
        <div className={styles.cardIcon}>🔥</div>
        <div className={styles.cardInfo}>
          <h5>Calorias</h5>
          <p>
            <span>{Math.round(todayTotals.calories)}</span> /{" "}
            {currentGoals.calories} kcal
          </p>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${caloriesPercent}%` }}
            />
          </div>
          <small>{Math.round(caloriesPercent)}% da meta</small>
        </div>
      </div>

      {/* Card de Proteína */}
      <div
        className={`${styles.summaryCard} ${styles.macroCard} ${styles.proteinCard}`}
      >
        <div className={styles.cardIcon}>🥩</div>
        <div className={styles.cardInfo}>
          <h5>Proteína</h5>
          <p>
            <span>{todayTotals.protein.toFixed(1)}</span> /{" "}
            {currentGoals.protein}g
          </p>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
          <small>{Math.round(proteinPercent)}% da meta</small>
        </div>
      </div>

      {/* Card de Carboidratos */}
      <div
        className={`${styles.summaryCard} ${styles.macroCard} ${styles.carbsCard}`}
      >
        <div className={styles.cardIcon}>🍞</div>
        <div className={styles.cardInfo}>
          <h5>Carboidratos</h5>
          <p>
            <span>{todayTotals.carbs.toFixed(1)}</span> / {currentGoals.carbs}g
          </p>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${carbsPercent}%` }}
            />
          </div>
          <small>{Math.round(carbsPercent)}% da meta</small>
        </div>
      </div>

      {/* Card de Gorduras */}
      <div
        className={`${styles.summaryCard} ${styles.macroCard} ${styles.fatCard}`}
      >
        <div className={styles.cardIcon}>🥑</div>
        <div className={styles.cardInfo}>
          <h5>Gorduras</h5>
          <p>
            <span>{todayTotals.fat.toFixed(1)}</span> / {currentGoals.fat}g
          </p>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${fatPercent}%` }}
            />
          </div>
          <small>{Math.round(fatPercent)}% da meta</small>
        </div>
      </div>

      {/* Card de Água */}
      <div className={`${styles.summaryCard} ${styles.waterCard}`}>
        <div className={styles.cardIcon}>💧</div>
        <div className={styles.cardInfo}>
          <h5>Água</h5>
          <p>
            <span>{todayWater}</span> / {currentGoals.water}ml
          </p>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${waterPercent}%` }}
            />
          </div>
          <small>{Math.round(waterPercent)}% da meta</small>
        </div>
      </div>

      {/* Resumo de Micronutrientes (simplificado) */}
      {Object.keys(todayMicronutrients).length > 0 && (
        <div
          className={`${styles.summaryCard} ${styles.micronutrientsSummaryCard}`}
        >
          <div className={styles.cardIcon}>🧬</div>
          <div className={styles.cardInfo}>
            <h5>Micronutrientes</h5>
            <div className={styles.micronutrientListSummary}>
              {Object.entries(todayMicronutrients).map(([key, value]) => {
                const goal = currentGoals.micronutrients?.[key] || 0;
                const percent = calculatePercentage(value as number, goal);
                const unit = getMicronutrientUnit(key); // ✅ Usando a função de utilidade
                return (
                  <div key={key} className={styles.micronutrientItemSummary}>
                    <span>
                      {key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                      :
                    </span>
                    <span>
                      {Math.round(value as number)} / {goal} {unit}
                    </span>{" "}
                    {/* ✅ Usando a unidade correta */}
                    <div className={`${styles.progressBar} ${styles.small}`}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NutritionSummaryCards;
