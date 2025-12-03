// src/components/WorkoutTracker/ExerciseExecution/SetTracker.tsx
import { useState } from "react";
import styles from "./SetTracker.module.css";

interface SetData {
  reps: number;
  weight: number;
  rpe: number;
  notes: string;
}

interface SetTrackerProps {
  setNumber: number;
  plannedReps: number;
  plannedWeight: number;
  currentData: SetData;
  onDataChange: (data: SetData) => void;
  onComplete: () => void;
  onSkip: () => void;
}

export function SetTracker({
  setNumber,
  plannedReps,
  plannedWeight,
  currentData,
  onDataChange,
  onComplete,
  onSkip,
}: SetTrackerProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateData = (field: keyof SetData, value: string | number) => {
    onDataChange({
      ...currentData,
      [field]: value,
    });
  };

  // Botões rápidos para ajustar reps
  const adjustReps = (delta: number) => {
    const newReps = Math.max(0, currentData.reps + delta);
    updateData("reps", newReps);
  };

  // Botões rápidos para ajustar peso
  const adjustWeight = (delta: number) => {
    const newWeight = Math.max(0, currentData.weight + delta);
    updateData("weight", newWeight);
  };

  // Validar se pode completar série
  const canComplete = currentData.reps > 0 && currentData.weight >= 0;

  return (
    <div className={styles.setTracker}>
      <header className={styles.setHeader}>
        <h3 className={styles.setTitle}>Série {setNumber}</h3>
        <div className={styles.plannedInfo}>
          <span className={styles.plannedLabel}>Planejado:</span>
          <span className={styles.plannedValue}>
            {plannedReps} reps × {plannedWeight}kg
          </span>
        </div>
      </header>

      <div className={styles.inputSection}>
        {/* Repetições */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Repetições</label>
          <div className={styles.numberInput}>
            <button
              className={styles.adjustButton}
              onClick={() => adjustReps(-1)}
              disabled={currentData.reps <= 0}
            >
              -
            </button>
            <input
              type="number"
              value={currentData.reps}
              onChange={(e) =>
                updateData("reps", parseInt(e.target.value) || 0)
              }
              className={styles.numberField}
              min="0"
              max="50"
            />
            <button
              className={styles.adjustButton}
              onClick={() => adjustReps(1)}
            >
              +
            </button>
          </div>

          {/* Botões rápidos para reps */}
          <div className={styles.quickButtons}>
            <button
              className={styles.quickButton}
              onClick={() => updateData("reps", plannedReps)}
            >
              Planejado ({plannedReps})
            </button>
            <button
              className={styles.quickButton}
              onClick={() => updateData("reps", plannedReps - 1)}
            >
              -1 ({plannedReps - 1})
            </button>
            <button
              className={styles.quickButton}
              onClick={() => updateData("reps", plannedReps + 1)}
            >
              +1 ({plannedReps + 1})
            </button>
          </div>
        </div>

        {/* Peso */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Peso (kg)</label>
          <div className={styles.numberInput}>
            <button
              className={styles.adjustButton}
              onClick={() => adjustWeight(-2.5)}
              disabled={currentData.weight <= 0}
            >
              -2.5
            </button>
            <input
              type="number"
              value={currentData.weight}
              onChange={(e) =>
                updateData("weight", parseFloat(e.target.value) || 0)
              }
              className={styles.numberField}
              min="0"
              step="0.5"
            />
            <button
              className={styles.adjustButton}
              onClick={() => adjustWeight(2.5)}
            >
              +2.5
            </button>
          </div>

          {/* Botões rápidos para peso */}
          <div className={styles.quickButtons}>
            <button
              className={styles.quickButton}
              onClick={() => updateData("weight", plannedWeight)}
            >
              Planejado ({plannedWeight}kg)
            </button>
            <button
              className={styles.quickButton}
              onClick={() => updateData("weight", plannedWeight - 2.5)}
            >
              -2.5kg
            </button>
            <button
              className={styles.quickButton}
              onClick={() => updateData("weight", plannedWeight + 2.5)}
            >
              +2.5kg
            </button>
          </div>
        </div>
      </div>

      {/* Configurações Avançadas */}
      <div className={styles.advancedSection}>
        <button
          className={styles.advancedToggle}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? "▼" : "▶"} Configurações Avançadas
        </button>

        {showAdvanced && (
          <div className={styles.advancedInputs}>
            {/* RPE (Rate of Perceived Exertion) */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                RPE (Esforço Percebido)
                <span className={styles.rpeHelp}>1-10</span>
              </label>
              <div className={styles.rpeSelector}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <button
                    key={value}
                    className={`${styles.rpeButton} ${
                      currentData.rpe === value ? styles.rpeActive : ""
                    }`}
                    onClick={() => updateData("rpe", value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className={styles.rpeDescription}>
                {getRPEDescription(currentData.rpe)}
              </div>
            </div>

            {/* Notas */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Notas da Série</label>
              <textarea
                value={currentData.notes}
                onChange={(e) => updateData("notes", e.target.value)}
                className={styles.notesField}
                placeholder="Ex: Última rep foi difícil, próxima vez diminuir peso..."
                rows={2}
              />
            </div>
          </div>
        )}
      </div>

      {/* Ações da Série */}
      <div className={styles.setActions}>
        <button className={styles.skipButton} onClick={onSkip}>
          ⏭️ Pular Série
        </button>

        <button
          className={`${styles.completeButton} ${
            !canComplete ? styles.disabled : ""
          }`}
          onClick={onComplete}
          disabled={!canComplete}
        >
          ✅ Série Concluída
        </button>
      </div>

      {/* Resumo da Série */}
      <div className={styles.setSummary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Volume:</span>
          <span className={styles.summaryValue}>
            {(currentData.reps * currentData.weight).toFixed(1)}kg
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>vs Planejado:</span>
          <span
            className={`${styles.summaryValue} ${
              currentData.reps * currentData.weight >=
              plannedReps * plannedWeight
                ? styles.positive
                : styles.negative
            }`}
          >
            {currentData.reps * currentData.weight -
              plannedReps * plannedWeight >
            0
              ? "+"
              : ""}
            {(
              currentData.reps * currentData.weight -
              plannedReps * plannedWeight
            ).toFixed(1)}
            kg
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper para descrição do RPE
function getRPEDescription(rpe: number): string {
  const descriptions: Record<number, string> = {
    1: "Muito fácil - sem esforço",
    2: "Fácil - esforço mínimo",
    3: "Moderado - algum esforço",
    4: "Um pouco difícil",
    5: "Difícil - esforço considerável",
    6: "Difícil - mais esforço",
    7: "Muito difícil - esforço intenso",
    8: "Muito difícil - quase máximo",
    9: "Extremamente difícil - máximo esforço",
    10: "Máximo esforço possível",
  };

  return descriptions[rpe] || "";
}
