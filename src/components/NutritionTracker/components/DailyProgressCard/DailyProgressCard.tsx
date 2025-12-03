// src/components/NutritionTracker/DailyProgressCard.tsx
import { useState, useEffect } from "react";
import { useNutritionContext } from "../../../../hooks/useNutritionContext";
import styles from "./DailyProgressCard.module.css";

function DailyProgressCard() {
  const { getDailyPlanningOverview } = useNutritionContext();
  const [isMobile, setIsMobile] = useState(false);

  // ✅ DETECTAR MOBILE
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const planningOverview = getDailyPlanningOverview();

  // ✅ SÓ MOSTRAR SE HOUVER ITENS
  if (
    planningOverview.totalPlannedItems === 0 &&
    planningOverview.totalConsumedItems === 0
  ) {
    return null;
  }

  return (
    <div
      className={`${styles.dailyProgressCard} ${
        isMobile ? styles.mobileLayout : ""
      }`}
    >
      <h3>📋 Progresso do Dia</h3>

      {/* ✅ PROGRESSO GERAL - LAYOUT RESPONSIVO */}
      <div
        className={`${styles.progressOverview} ${
          isMobile ? styles.mobileOverview : ""
        }`}
      >
        <div
          className={`${styles.progressStats} ${
            isMobile ? styles.mobileStats : ""
          }`}
        >
          <div className={`${styles.progressStat} ${styles.planned}`}>
            <div className={styles.statIcon}>⏳</div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Planejado</span>
              <span className={styles.statValue}>
                {planningOverview.totalPlannedItems} itens
              </span>
              <span className={styles.statCalories}>
                {planningOverview.totalPlannedCalories} kcal
              </span>
            </div>
          </div>

          <div className={`${styles.progressStat} ${styles.consumed}`}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Consumido</span>
              <span className={styles.statValue}>
                {planningOverview.totalConsumedItems} itens
              </span>
              <span className={styles.statCalories}>
                {planningOverview.totalConsumedCalories} kcal
              </span>
            </div>
          </div>

          <div className={`${styles.progressStat} ${styles.completion}`}>
            <div className={styles.statIcon}>🎯</div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Conclusão</span>
              <span className={styles.statValue}>
                {planningOverview.overallCompletionPercentage}%
              </span>
              <div className={styles.completionBar}>
                <div
                  className={styles.completionFill}
                  style={{
                    width: `${planningOverview.overallCompletionPercentage}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ PROGRESSO POR REFEIÇÃO - LAYOUT EM COLUNAS NO MOBILE */}
      <div className={styles.mealsProgress}>
        <h4>📊 Progresso por Refeição</h4>
        <div
          className={`${styles.mealsProgressGrid} ${
            isMobile ? styles.mobileGrid : ""
          }`}
        >
          {planningOverview.mealStats.map((mealStat) => {
            const totalItems = mealStat.plannedItems + mealStat.consumedItems;
            if (totalItems === 0) return null;

            const mealIcons = {
              breakfast: "🌅",
              lunch: "🌞",
              dinner: "🌙",
              snack: "🍎",
            };

            const mealNames = {
              breakfast: "Café da Manhã",
              lunch: "Almoço",
              dinner: "Jantar",
              snack: "Lanches",
            };

            return (
              <div
                key={mealStat.meal}
                className={`${styles.mealProgressItem} ${
                  isMobile ? styles.mobileItem : ""
                }`}
              >
                <div className={styles.mealProgressHeader}>
                  <span className={styles.mealIcon}>
                    {mealIcons[mealStat.meal]}
                  </span>
                  <span className={styles.mealName}>
                    {mealNames[mealStat.meal]}
                  </span>
                  <span className={styles.mealPercentage}>
                    {mealStat.completionPercentage}%
                  </span>
                </div>
                <div className={styles.mealProgressBar}>
                  <div
                    className={styles.mealProgressFill}
                    style={{ width: `${mealStat.completionPercentage}%` }}
                  />
                </div>
                <div className={styles.mealProgressDetails}>
                  <span className={styles.consumedItems}>
                    ✅ {mealStat.consumedItems}
                  </span>
                  <span className={styles.plannedItems}>
                    ⏳ {mealStat.plannedItems}
                  </span>
                  <span className={styles.totalCalories}>
                    {mealStat.consumedCalories + mealStat.plannedCalories} kcal
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ✅ PROGRESSO DA ÁGUA - RESPONSIVO */}
      {(planningOverview.waterStats.plannedAmount > 0 ||
        planningOverview.waterStats.consumedAmount > 0) && (
        <div
          className={`${styles.waterProgress} ${
            isMobile ? styles.mobileWater : ""
          }`}
        >
          <h4>💧 Progresso da Hidratação</h4>
          <div
            className={`${styles.waterProgressItem} ${
              isMobile ? styles.mobileWaterItem : ""
            }`}
          >
            <div className={styles.waterProgressHeader}>
              <span className={styles.waterIcon}>💧</span>
              <span className={styles.waterName}>Água</span>
              <span className={styles.waterPercentage}>
                {planningOverview.waterStats.completionPercentage}%
              </span>
            </div>
            <div className={styles.waterProgressBar}>
              <div
                className={styles.waterProgressFill}
                style={{
                  width: `${planningOverview.waterStats.completionPercentage}%`,
                }}
              />
            </div>
            <div className={styles.waterProgressDetails}>
              <span className={styles.consumedWater}>
                ✅ {planningOverview.waterStats.consumedAmount}ml
              </span>
              <span className={styles.plannedWater}>
                ⏳ {planningOverview.waterStats.plannedAmount}ml
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DailyProgressCard;
