// src/components/WorkoutTracker/WorkoutDailyLog/WorkoutDailyLog.tsx

import { useState } from "react";
import { useWorkout } from "../../../contexts/WorkoutContext";
import { ExerciseLogEntry } from "./components/ExerciseLogEntry/ExerciseLogEntry";
import type {
  PlannedExercise,
  WorkoutSession,
  LoggedExercise,
  WorkoutDay,
} from "../../../types";
import styles from "./WorkoutDailyLog.module.css";

interface ExerciseInputState {
  weight: string;
  sets: string;
  reps: string;
  rpe: string;
  restTime: string;
  notes: string;
  isStrengthTraining: boolean;
}

export function WorkoutDailyLog() {
  const { state, dispatch } = useWorkout();
  const [isStrengthTrainingSession, setIsStrengthTrainingSession] =
    useState(false);

  const activeWorkoutDay = state.workoutDays.find(
    (day: WorkoutDay) => day.id === state.activeDayId
  );

  const [exerciseInputs, setExerciseInputs] = useState<
    Record<string, ExerciseInputState>
  >(() => {
    if (activeWorkoutDay) {
      const initialInputs: Record<string, ExerciseInputState> = {};
      activeWorkoutDay.exercises.forEach((exercise: PlannedExercise) => {
        initialInputs[exercise.id] = {
          weight: exercise.plannedWeight.toString(),
          sets: exercise.plannedSets.toString(),
          reps: exercise.plannedReps.toString(),
          rpe: "",
          restTime: "",
          notes: exercise.notes || "",
          isStrengthTraining: false,
        };
      });
      return initialInputs;
    }
    return {};
  });

  const handleInputChange = (
    exerciseId: string,
    field: keyof ExerciseInputState,
    value: string | boolean
  ) => {
    setExerciseInputs((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [field]: value,
      },
    }));
  };

  const handleLogWorkout = () => {
    if (!activeWorkoutDay) return;

    const newSessionId = Date.now().toString();

    // ✅ Corrigir WorkoutSession com todas as propriedades necessárias
    const newWorkoutSession: WorkoutSession = {
      id: newSessionId,
      dayId: activeWorkoutDay.id, // ✅ Manter dayId
      workoutDayId: activeWorkoutDay.id, // ✅ Adicionar workoutDayId
      date: new Date().toISOString(),
      startTime: new Date().toISOString(), // ✅ Adicionar startTime obrigatório
      exercises: [], // ✅ Adicionar exercises obrigatório
      notes: "",
      isStrengthTrainingSession: isStrengthTrainingSession,
    };

    dispatch({ type: "ADD_WORKOUT_SESSION", payload: newWorkoutSession });

    const loggedExercises: LoggedExercise[] = [];
    activeWorkoutDay.exercises.forEach((plannedExercise: PlannedExercise) => {
      const inputs = exerciseInputs[plannedExercise.id];
      if (
        inputs &&
        (Number(inputs.weight) > 0 ||
          Number(inputs.sets) > 0 ||
          Number(inputs.reps) > 0)
      ) {
        const weight = Number(inputs.weight);
        const sets = Number(inputs.sets);
        const reps = Number(inputs.reps);

        loggedExercises.push({
          id: `${newSessionId}-${plannedExercise.id}`,
          workoutSessionId: newSessionId,
          exerciseDefinitionId: plannedExercise.exerciseDefinitionId,
          exerciseName: plannedExercise.name,
          weight: weight,
          sets: sets,
          reps: reps,
          volume: weight * sets * reps,
          date: new Date().toISOString(),
          dayId: activeWorkoutDay.id,
          notes: inputs.notes,
          rpe: inputs.rpe ? Number(inputs.rpe) : undefined,
          restTime: inputs.restTime ? Number(inputs.restTime) : undefined, // ✅ Agora está correto
          isStrengthTraining: inputs.isStrengthTraining,
        });
      }
    });

    loggedExercises.forEach((loggedEx) => {
      dispatch({ type: "LOG_EXERCISE", payload: loggedEx });
    });

    alert("Treino registrado com sucesso!");
  };

  if (!activeWorkoutDay) {
    return (
      <div className={styles.workoutDailyLog}>
        <p className={styles.emptyMessage}>
          Selecione um dia de treino ou configure uma rotina.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.workoutDailyLog}>
      <h3 className={styles.dayTitle}>{activeWorkoutDay.name}</h3>

      {activeWorkoutDay.exercises.length === 0 ? (
        <p className={styles.emptyMessage}>
          Nenhum exercício planejado para este dia. Adicione na aba de
          Configurações!
        </p>
      ) : (
        <>
          <div className={styles.sessionToggleContainer}>
            <label
              htmlFor="isStrengthTrainingSession"
              className={styles.sessionToggleLabel}
            >
              Sessão de Treino de Força
            </label>
            <label className={styles.toggleSwitch}>
              <input
                type="checkbox"
                id="isStrengthTrainingSession"
                checked={isStrengthTrainingSession}
                onChange={(e) => setIsStrengthTrainingSession(e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.exerciseList}>
            {activeWorkoutDay.exercises.map((exercise: PlannedExercise) => (
              <ExerciseLogEntry
                key={exercise.id}
                plannedExercise={exercise}
                inputs={
                  exerciseInputs[exercise.id] || {
                    weight: "",
                    sets: "",
                    reps: "",
                    rpe: "",
                    restTime: "",
                    notes: "",
                    isStrengthTraining: false,
                  }
                }
                onInputChange={handleInputChange}
              />
            ))}
          </div>

          <button
            onClick={handleLogWorkout}
            className={styles.logWorkoutButton}
          >
            Registrar Treino
          </button>
        </>
      )}
    </div>
  );
}
