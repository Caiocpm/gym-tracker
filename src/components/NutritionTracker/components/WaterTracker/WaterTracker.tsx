// src/components/NutritionTracker/WaterTracker/WaterTracker.tsx
import { useState } from "react";
import { useNutritionContext } from "../../../../hooks/useNutritionContext";
import styles from "./WaterTracker.module.css"; // Importa os estilos como um objeto

interface WaterTrackerProps {
  current: number;
  goal: number;
}

function WaterTracker({ current, goal }: WaterTrackerProps) {
  const context = useNutritionContext();
  const { state, addWaterEntry, markWaterAsConsumed } = context;
  const [customAmount, setCustomAmount] = useState(250);

  const percentage = Math.min((current / goal) * 100, 100);
  const remaining = Math.max(0, goal - current);

  const quickAmounts = [200, 250, 300, 500];

  const handleAddWater = (amount: number) => {
    try {
      const currentTime = new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      addWaterEntry(amount, state.selectedDate, currentTime);

      // ✅ MARCAR COMO CONSUMIDA APÓS UM PEQUENO DELAY
      setTimeout(() => {
        // Buscar a entrada mais recente que foi adicionada
        const recentEntries = state.waterEntries
          .filter((entry) => entry.date === state.selectedDate)
          .sort((a, b) => {
            const timeA = new Date(a.plannedAt || a.time).getTime();
            const timeB = new Date(b.plannedAt || b.time).getTime();
            return timeB - timeA; // Mais recente primeiro
          });

        // Pegar a primeira entrada que está como "planned"
        const lastPlannedEntry = recentEntries.find(
          (entry) => entry.status === "planned"
        );

        if (lastPlannedEntry) {
          markWaterAsConsumed(lastPlannedEntry.id);
        }
      }, 200); // Aumentado para 200ms para garantir que o estado foi atualizado
    } catch {
      // Erro ao adicionar água
    }
  };

  return (
    <div className={styles.waterTracker}>
      <h4 className={styles.waterTrackerTitle}>💧 Hidratação</h4>{" "}
      {/* Adicionado classe específica */}
      <div className={styles.waterProgress}>
        <div className={styles.waterVisual}>
          {" "}
          {/* Adicionado classe específica */}
          <div className={styles.waterBottle}>
            <div
              className={styles.waterFill}
              style={{ height: `${percentage}%` }}
            />
            <div className={styles.waterText}>
              <span className={styles.current}>{current}ml</span>{" "}
              {/* Adicionado classe específica */}
              <span className={styles.goal}>/ {goal}ml</span>{" "}
              {/* Adicionado classe específica */}
            </div>
          </div>
        </div>

        <div className={styles.waterInfo}>
          <div className={styles.waterStats}>
            <div className={styles.stat}>
              <span className={styles.label}>Progresso:</span>
              <span className={styles.value}>{Math.round(percentage)}%</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>Restam:</span>
              <span className={styles.value}>{remaining}ml</span>
            </div>
          </div>

          <div className={styles.waterControls}>
            {" "}
            {/* Adicionado classe específica */}
            <div className={styles.quickButtons}>
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  className={styles.quickWaterButton}
                  onClick={() => {
                    handleAddWater(amount);
                  }}
                >
                  +{amount}ml
                </button>
              ))}
            </div>
            <div className={styles.customWater}>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(Number(e.target.value))}
                min="1"
                max="1000"
                placeholder="ml"
                className={styles.customWaterInput} // Adicionado classe específica
              />
              <button
                className={styles.addCustomWater}
                onClick={() => {
                  handleAddWater(customAmount);
                }}
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default WaterTracker;
