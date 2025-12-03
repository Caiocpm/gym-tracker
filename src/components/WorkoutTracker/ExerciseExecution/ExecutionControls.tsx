// src/components/WorkoutTracker/ExerciseExecution/ExecutionControls.tsx
import styles from "./ExecutionControls.module.css";

interface ExecutionControlsProps {
  canComplete: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

export function ExecutionControls({
  canComplete,
  onComplete,
  onCancel,
}: ExecutionControlsProps) {
  return (
    <div className={styles.controlsContainer}>
      <div className={styles.controlsGroup}>
        <button className={styles.cancelButton} onClick={onCancel}>
          ❌ Cancelar Exercício
        </button>

        {canComplete && (
          <button className={styles.completeButton} onClick={onComplete}>
            🎉 Finalizar Exercício
          </button>
        )}
      </div>

      {!canComplete && (
        <div className={styles.helpText}>
          Complete todas as séries para finalizar o exercício
        </div>
      )}
    </div>
  );
}
