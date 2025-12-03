// src/components/WorkoutTracker/WorkoutDailyLog/components/ExerciseLogEntry/ExerciseLogEntry.tsx

import { useState } from "react";
import type { PlannedExercise } from "../../../../../types"; // ✅ CORREÇÃO: 5 ../
import styles from "./ExerciseLogEntry.module.css";

interface ExerciseLogEntryProps {
  plannedExercise: PlannedExercise;
  inputs: {
    weight: string;
    sets: string;
    reps: string;
    rpe: string;
    restTime: string;
    notes: string;
    isStrengthTraining: boolean;
  };
  onInputChange: (
    exerciseId: string,
    field: keyof ExerciseLogEntryProps["inputs"],
    value: string | boolean
  ) => void;
}

export function ExerciseLogEntry({
  plannedExercise,
  inputs,
  onInputChange,
}: ExerciseLogEntryProps) {
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);

  return (
    <div className={styles.exerciseLogEntry}>
      <h4 className={styles.exerciseName}>{plannedExercise.name}</h4>

      <div className={styles.inputRow}>
        <div className={styles.formGroup}>
          <label htmlFor={`weight-${plannedExercise.id}`}>Peso (kg)</label>
          <input
            type="number"
            id={`weight-${plannedExercise.id}`}
            value={inputs.weight}
            onChange={(e) =>
              onInputChange(plannedExercise.id, "weight", e.target.value)
            }
            placeholder={plannedExercise.plannedWeight.toString()}
            min="0"
            step="0.5"
            className={styles.inputField}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor={`sets-${plannedExercise.id}`}>Séries</label>
          <input
            type="number"
            id={`sets-${plannedExercise.id}`}
            value={inputs.sets}
            onChange={(e) =>
              onInputChange(plannedExercise.id, "sets", e.target.value)
            }
            placeholder={plannedExercise.plannedSets.toString()}
            min="0"
            className={styles.inputField}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor={`reps-${plannedExercise.id}`}>Repetições</label>
          <input
            type="number"
            id={`reps-${plannedExercise.id}`}
            value={inputs.reps}
            onChange={(e) =>
              onInputChange(plannedExercise.id, "reps", e.target.value)
            }
            placeholder={plannedExercise.plannedReps.toString()}
            min="0"
            className={styles.inputField}
          />
        </div>
      </div>

      <div className={styles.toggleContainer}>
        <label
          htmlFor={`isStrengthTraining-${plannedExercise.id}`}
          className={styles.toggleLabel}
        >
          Treino de Força (específico para este exercício)
        </label>
        <label className={styles.toggleSwitch}>
          <input
            type="checkbox"
            id={`isStrengthTraining-${plannedExercise.id}`}
            checked={inputs.isStrengthTraining}
            onChange={(e) =>
              onInputChange(
                plannedExercise.id,
                "isStrengthTraining",
                e.target.checked
              )
            }
          />
          <span className={styles.slider}></span>
        </label>
      </div>

      <div className={styles.toggleContainer}>
        <label
          htmlFor={`showAdvancedMetrics-${plannedExercise.id}`}
          className={styles.toggleLabel}
        >
          Métricas Avançadas (RPE, Tempo de Descanso)
        </label>
        <label className={styles.toggleSwitch}>
          <input
            type="checkbox"
            id={`showAdvancedMetrics-${plannedExercise.id}`}
            checked={showAdvancedMetrics}
            onChange={(e) => setShowAdvancedMetrics(e.target.checked)}
          />
          <span className={styles.slider}></span>
        </label>
      </div>

      {showAdvancedMetrics && (
        <div className={styles.advancedMetrics}>
          <div className={styles.inputRow}>
            <div className={styles.formGroup}>
              <label htmlFor={`rpe-${plannedExercise.id}`}>RPE (0-10)</label>
              <input
                type="number"
                id={`rpe-${plannedExercise.id}`}
                value={inputs.rpe}
                onChange={(e) =>
                  onInputChange(plannedExercise.id, "rpe", e.target.value)
                }
                placeholder="Ex: 8"
                min="0"
                max="10"
                step="1"
                className={styles.inputField}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor={`restTime-${plannedExercise.id}`}>
                Descanso (seg)
              </label>
              <input
                type="number"
                id={`restTime-${plannedExercise.id}`}
                value={inputs.restTime}
                onChange={(e) =>
                  onInputChange(plannedExercise.id, "restTime", e.target.value)
                }
                placeholder="Ex: 90"
                min="0"
                step="5"
                className={styles.inputField}
              />
            </div>
          </div>
        </div>
      )}

      <div className={styles.formGroup}>
        <label htmlFor={`notes-${plannedExercise.id}`}>Observações</label>
        <textarea
          id={`notes-${plannedExercise.id}`}
          value={inputs.notes}
          onChange={(e) =>
            onInputChange(plannedExercise.id, "notes", e.target.value)
          }
          placeholder={
            plannedExercise.notes || "Observações para este exercício..."
          }
          rows={2}
          className={styles.textareaField}
        />
      </div>
    </div>
  );
}
