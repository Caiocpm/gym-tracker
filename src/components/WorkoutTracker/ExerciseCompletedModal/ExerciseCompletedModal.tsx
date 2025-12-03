// src/components/WorkoutTracker/ExerciseCompletedModal/ExerciseCompletedModal.tsx
import { useEffect } from "react";
import type { LoggedExercise } from "../../../types";
import { Portal } from "../../UI/Portal/Portal"; // ✅ NOVO IMPORT
import styles from "./ExerciseCompletedModal.module.css";

interface ExerciseCompletedModalProps {
  isOpen: boolean;
  exercise: LoggedExercise;
  onClose: () => void;
  onRestart?: () => void;
}

export function ExerciseCompletedModal({
  isOpen,
  exercise,
  onClose,
  onRestart,
}: ExerciseCompletedModalProps) {
  // ✅ ADICIONAR efeito para bloquear scroll do body
  useEffect(() => {
    if (isOpen) {
      // Bloquear scroll do body quando modal abrir
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Restaurar scroll quando modal fechar
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // ✅ ADICIONAR handler para ESC key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatVolume = (volume: number) => {
    return volume.toLocaleString("pt-BR") + " kg";
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Portal>
      {" "}
      {/* ✅ USAR PORTAL */}
      <div className={styles.modalOverlay} onClick={handleOverlayClick}>
        <div
          className={styles.modalContent}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className={styles.modalHeader}>
            <div className={styles.headerInfo}>
              <h3 id="modal-title" className={styles.exerciseName}>
                {exercise.exerciseName}
              </h3>
              <span className={styles.completedBadge}>✅ Concluído</span>
            </div>
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Fechar modal"
              type="button"
            >
              ✕
            </button>
          </div>

          <div className={styles.modalBody}>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Séries</span>
                <span className={styles.summaryValue}>{exercise.sets}</span>
              </div>

              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Repetições</span>
                <span className={styles.summaryValue}>{exercise.reps}</span>
              </div>

              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Peso Médio</span>
                <span className={styles.summaryValue}>{exercise.weight}kg</span>
              </div>

              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Volume Total</span>
                <span className={styles.summaryValue}>
                  {formatVolume(exercise.volume)}
                </span>
              </div>

              {exercise.rpe && (
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>RPE Médio</span>
                  <span className={styles.summaryValue}>{exercise.rpe}/10</span>
                </div>
              )}
            </div>

            <div className={styles.completionInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>📅 Concluído em:</span>
                <span className={styles.infoValue}>
                  {formatDate(exercise.date)}
                </span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>🏋️ Tipo:</span>
                <span className={styles.infoValue}>
                  {exercise.isStrengthTraining
                    ? "Treino de Força"
                    : "Treino de Resistência"}
                </span>
              </div>
            </div>

            {exercise.notes && (
              <div className={styles.notesSection}>
                <h4 className={styles.notesTitle}>📝 Observações</h4>
                <p className={styles.notesText}>{exercise.notes}</p>
              </div>
            )}
          </div>

          <div className={styles.modalActions}>
            <button
              className={styles.closeActionButton}
              onClick={onClose}
              type="button"
            >
              Fechar
            </button>

            {onRestart && (
              <button
                className={styles.restartButton}
                onClick={onRestart}
                type="button"
              >
                🔄 Refazer Exercício
              </button>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}
