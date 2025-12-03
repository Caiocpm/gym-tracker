// src/components/WorkoutTracker/WorkoutCompletionToast/WorkoutCompletionToast.tsx
import { useState } from "react";
import styles from "./WorkoutCompletionToast.module.css";

interface WorkoutCompletionToastProps {
  isVisible: boolean;
  onShare: () => void;
  onDismiss: () => void;
  workoutName: string;
}

export function WorkoutCompletionToast({
  isVisible,
  onShare,
  onDismiss,
  workoutName,
}: WorkoutCompletionToastProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isVisible || isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss();
  };

  return (
    <div className={styles.toast}>
      <div className={styles.toastContent}>
        <div className={styles.toastMessage}>
          <span className={styles.icon}>🎉</span>
          <div className={styles.text}>
            <h4>{workoutName} Concluído!</h4>
            <p>Compartilhe seu treino com seus grupos</p>
          </div>
        </div>

        <div className={styles.toastActions}>
          <button
            className={styles.shareBtn}
            onClick={onShare}
            title="Compartilhar treino"
          >
            📤 Compartilhar
          </button>
          <button
            className={styles.dismissBtn}
            onClick={handleDismiss}
            title="Descartar"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
