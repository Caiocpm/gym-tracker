// src/components/WorkoutTracker/ExerciseList/ExerciseList.tsx
import { useWorkout } from "../../../contexts/WorkoutContext";
import { ExerciseCard } from "../ExerciseCard/ExerciseCard";
import type { PlannedExercise } from "../../../types";
import styles from "./ExerciseList.module.css";

interface ExerciseListProps {
  onStartExercise: (exercise: PlannedExercise) => void;
  isStrengthTraining?: boolean; // ✅ Receber flag
}

export function ExerciseList({
  onStartExercise,
  isStrengthTraining = false,
}: ExerciseListProps) {
  const { state } = useWorkout();

  // ✅ MAPEAR DIAS PARA LETRAS
  const dayLabels = ["A", "B", "C", "D", "E", "F", "G"];

  const getDayLabel = (dayId: string) => {
    const dayIndex = state.workoutDays.findIndex((day) => day.id === dayId);
    return dayIndex !== -1 ? dayLabels[dayIndex] : `T${dayIndex + 1}`;
  };

  const getDayName = (dayId: string) => {
    const day = state.workoutDays.find((d) => d.id === dayId);
    return day?.name || `Treino ${getDayLabel(dayId)}`;
  };

  const activeDay = state.workoutDays.find(
    (day) => day.id === state.activeDayId
  );
  const activeDayExercises = activeDay?.exercises || [];

  if (activeDayExercises.length === 0) {
    return (
      <div className={styles.exerciseListCard}>
        <div className={styles.exerciseListHeader}>
          <h3>
            Treino {getDayLabel(state.activeDayId || "")} -{" "}
            {getDayName(state.activeDayId || "")}
          </h3>
          {/* ✅ Indicador do tipo de treino */}
          <span
            className={`${styles.trainingType} ${
              isStrengthTraining ? styles.strength : styles.resistance
            }`}
          >
            {isStrengthTraining ? "💪 Força" : "🏃 Resistência"}
          </span>
        </div>

        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💪</div>
          <h4>Nenhum exercício encontrado</h4>
          <p>Configure seus treinos para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.exerciseListCard}>
      <div className={styles.exerciseListHeader}>
        <h3>
          Treino {getDayLabel(state.activeDayId || "")} -{" "}
          {getDayName(state.activeDayId || "")}
        </h3>
        <div className={styles.headerInfo}>
          <span className={styles.totalExercises}>
            {activeDayExercises.length} exercícios
          </span>
          {/* ✅ Indicador do tipo de treino */}
          <span
            className={`${styles.trainingType} ${
              isStrengthTraining ? styles.strength : styles.resistance
            }`}
          >
            {isStrengthTraining ? "💪 Força" : "🏃 Resistência"}
          </span>
        </div>
      </div>

      <div className={styles.exerciseGrid}>
        {activeDayExercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onStartExercise={onStartExercise}
            isStrengthTraining={isStrengthTraining} // ✅ Passar flag
          />
        ))}
      </div>
    </div>
  );
}
