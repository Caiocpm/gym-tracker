// src/components/WorkoutTracker/ExerciseCard/ExerciseCard.tsx
import { useState } from "react";
import { useWorkout } from "../../../contexts/WorkoutContext";
import { ExerciseCompletedModal } from "../ExerciseCompletedModal/ExerciseCompletedModal"; // ✅ NOVO IMPORT
import type { PlannedExercise, ExerciseExecution } from "../../../types";
import styles from "./ExerciseCard.module.css";

interface ExerciseCardProps {
  exercise: PlannedExercise;
  onStartExercise?: (exercise: PlannedExercise) => void;
  isStrengthTraining?: boolean;
}

export function ExerciseCard({
  exercise,
  onStartExercise,
  isStrengthTraining = false,
}: ExerciseCardProps) {
  const { state, dispatch } = useWorkout();
  const [showCompletedModal, setShowCompletedModal] = useState(false); // ✅ NOVO ESTADO

  // ✅ VERIFICAR se o exercício foi concluído
  const completedInfo = state.completedExercises[exercise.id];
  const isCompleted = !!completedInfo;

  const handleExecute = () => {
    // ✅ Se concluído, abrir modal
    if (isCompleted) {
      setShowCompletedModal(true);
      return;
    }

    // ✅ Se tem callback, usa ele (para integração com WorkoutTracker)
    if (onStartExercise) {
      onStartExercise(exercise);
      return;
    }

    // ✅ Senão, usa o dispatch direto (para uso standalone)
    const execution: ExerciseExecution = {
      id: `exec-${Date.now()}`,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      startTime: new Date().toISOString(),
      currentSet: 1,
      totalSets: exercise.plannedSets,
      isActive: true,
      isPaused: false,
      completedSets: [],
      timerConfig: {
        defaultRestTime: exercise.plannedRestTime || 90,
        autoStart: exercise.autoStartTimer || true,
        enableNotifications: true,
        enableSound: true,
        enableVibration: false,
      },
    };

    dispatch({ type: "START_EXERCISE_EXECUTION", payload: execution });
  };

  // ✅ FUNÇÃO para refazer exercício
  const handleRestartExercise = () => {
    // Limpar exercício concluído
    dispatch({
      type: "CLEAR_COMPLETED_EXERCISE",
      payload: exercise.id,
    });

    setShowCompletedModal(false);

    // Executar exercício normalmente
    if (onStartExercise) {
      onStartExercise(exercise);
    } else {
      const execution: ExerciseExecution = {
        id: `exec-${Date.now()}`,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        startTime: new Date().toISOString(),
        currentSet: 1,
        totalSets: exercise.plannedSets,
        isActive: true,
        isPaused: false,
        completedSets: [],
        timerConfig: {
          defaultRestTime: exercise.plannedRestTime || 90,
          autoStart: exercise.autoStartTimer || true,
          enableNotifications: true,
          enableSound: true,
          enableVibration: false,
        },
      };

      dispatch({ type: "START_EXERCISE_EXECUTION", payload: execution });
    }
  };

  return (
    <div
      className={`${styles.exerciseCard} ${
        isStrengthTraining ? styles.strengthMode : styles.resistanceMode
      } ${isCompleted ? styles.completedCard : ""}`} // ✅ NOVO ESTILO
    >
      <h3 className={styles.exerciseName}>{exercise.name}</h3>

      <div className={styles.exerciseStats}>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Séries</div>
          <div className={styles.statValue}>{exercise.plannedSets}</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Reps</div>
          <div className={styles.statValue}>{exercise.plannedReps}</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Peso</div>
          <div className={styles.statValue}>
            {exercise.plannedWeight > 0
              ? `${exercise.plannedWeight}kg`
              : "Corporal"}
          </div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Descanso</div>
          <div className={styles.statValue}>
            {Math.floor((exercise.plannedRestTime || 90) / 60)}:
            {((exercise.plannedRestTime || 90) % 60)
              .toString()
              .padStart(2, "0")}
          </div>
        </div>
      </div>

      {exercise.notes && (
        <div className={styles.exerciseNotes}>📝 {exercise.notes}</div>
      )}

      {/* ✅ MOSTRAR informações de conclusão se concluído */}
      {isCompleted && completedInfo && (
        <div className={styles.completedInfo}>
          <span className={styles.completedBadge}>✅ Concluído</span>
          {completedInfo.loggedExercise.isPersonalRecord && (
            <span className={styles.recordBadge}>🏆 Recorde!</span>
          )}
          <span className={styles.completedDate}>
            {new Date(completedInfo.completedAt).toLocaleDateString("pt-BR")}
          </span>
        </div>
      )}

      <div className={styles.exerciseActions}>
        <button
          onClick={handleExecute}
          className={`${styles.executeButton} ${
            isCompleted ? styles.completedButton : ""
          }`} // ✅ NOVO ESTILO
        >
          {isCompleted ? (
            <>
              <span>✅</span>
              Exercício Concluído
            </>
          ) : (
            <>
              <span>▶️</span>
              Executar
            </>
          )}
        </button>
      </div>

      {/* ✅ MODAL para exercício concluído */}
      {isCompleted && completedInfo && (
        <ExerciseCompletedModal
          isOpen={showCompletedModal}
          exercise={completedInfo.loggedExercise}
          onClose={() => setShowCompletedModal(false)}
          onRestart={handleRestartExercise}
        />
      )}
    </div>
  );
}
