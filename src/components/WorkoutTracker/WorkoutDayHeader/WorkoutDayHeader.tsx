// src/components/WorkoutTracker/WorkoutDayHeader/WorkoutDayHeader.tsx
import { useState } from "react";
import { TrainingInfoModal } from "../TrainingInfoModal/TrainingInfoModal";
import styles from "./WorkoutDayHeader.module.css";

interface WorkoutDayHeaderProps {
  dayName: string;
  isStrengthTraining: boolean;
  onToggleTrainingType: (isStrength: boolean) => void;
  exerciseCount: number;
}

export function WorkoutDayHeader({
  dayName,
  isStrengthTraining,
  onToggleTrainingType,
  exerciseCount,
}: WorkoutDayHeaderProps) {
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleInfoClick = () => {
    setShowInfoModal(true);
  };

  const handleCloseModal = () => {
    setShowInfoModal(false);
  };

  return (
    <div className={styles.headerContainer}>
      <div className={styles.titleSection}>
        <h2 className={styles.dayName}>{dayName}</h2>
        <span className={styles.exerciseCount}>
          {exerciseCount} exercício{exerciseCount !== 1 ? "s" : ""}
        </span>
      </div>

      <div className={styles.controlsSection}>
        <div className={styles.trainingToggle}>
          <span className={styles.toggleLabel}>
            {isStrengthTraining ? "💪" : "🏃"}
          </span>

          <label className={styles.toggleSwitch}>
            <input
              type="checkbox"
              checked={isStrengthTraining}
              onChange={(e) => onToggleTrainingType(e.target.checked)}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSlider}></span>
          </label>

          <span className={styles.toggleText}>
            {isStrengthTraining ? "Força" : "Resistência"}
          </span>
        </div>

        <button
          className={styles.infoButton}
          onClick={handleInfoClick}
          title="Informações sobre tipos de treino e RPE"
          type="button"
          aria-label="Abrir informações sobre tipos de treino e RPE"
        >
          ?
        </button>
      </div>

      {/* ✅ MODAL com key prop para resetar aba quando abrir */}
      <TrainingInfoModal
        key={showInfoModal ? "modal-open" : "modal-closed"}
        isOpen={showInfoModal}
        onClose={handleCloseModal}
      />
    </div>
  );
}
