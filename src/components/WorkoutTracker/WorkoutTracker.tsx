// src/components/WorkoutTracker/WorkoutTracker.tsx
import { useState, useMemo, useEffect } from "react";
import { useWorkout } from "../../contexts/WorkoutContext";
import { WorkoutNavigation } from "./WorkoutNavigation/WorkoutNavigation";
import { WorkoutDayHeader } from "./WorkoutDayHeader/WorkoutDayHeader";
import { ExerciseList } from "./ExerciseList/ExerciseList";
import { ExerciseExecution } from "./ExerciseExecution/ExerciseExecution";
import { WorkoutSettings } from "./WorkoutSettings/WorkoutSettings";
import { WorkoutCompletionToast } from "./WorkoutCompletionToast/WorkoutCompletionToast";
import { ShareWorkoutModal } from "../Groups/ShareWorkoutModal";
import type { ExerciseRecord } from "../../types/social";
import type {
  PlannedExercise,
  LoggedExercise,
  WorkoutSession,
} from "../../types";
import styles from "./WorkoutTracker.module.css";

export function WorkoutTracker() {
  const { state, dispatch } = useWorkout();
  const [showSettings, setShowSettings] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isStrengthTraining, setIsStrengthTraining] = useState(false);

  // ✅ Derivar executingExercise diretamente do estado global
  const executingExercise = useMemo(() => {
    if (state.activeExercise) {
      return state.activeExercise;
    }
    return null;
  }, [state.activeExercise]);

  // ✅ Obter o dia ativo
  const activeDay = useMemo(() => {
    return state.workoutDays.find((day) => day.id === state.activeDayId);
  }, [state.workoutDays, state.activeDayId]);

  // Verificar se todos os exercícios do dia foram concluídos
  const allExercisesCompleted = useMemo(() => {
    if (!activeDay || activeDay.exercises.length === 0) return false;

    const today = new Date().toISOString().split("T")[0];
    const todaySession = state.workoutSessions.find(
      (session: WorkoutSession) => {
        const sessionDate = session.date.split("T")[0];
        return sessionDate === today && session.dayId === activeDay.id;
      }
    );

    if (!todaySession) return false;

    return activeDay.exercises.every((plannedEx) =>
      todaySession.exercises.some(
        (loggedEx: LoggedExercise) =>
          loggedEx.exerciseDefinitionId === plannedEx.exerciseDefinitionId
      )
    );
  }, [activeDay, state.workoutSessions]);

  // ✅ CORRIGIDO: Preparar dados do treino para compartilhamento
  const workoutDataForSharing = useMemo(() => {
    if (!activeDay || !allExercisesCompleted) return null;

    const today = new Date().toISOString().split("T")[0];
    const todaySession = state.workoutSessions.find(
      (session: WorkoutSession) => {
        const sessionDate = session.date.split("T")[0];
        return sessionDate === today && session.dayId === activeDay.id;
      }
    );

    if (
      !todaySession ||
      !todaySession.exercises ||
      todaySession.exercises.length === 0
    ) {
      return null;
    }

    const startTime = new Date(todaySession.startTime).getTime();
    const endTime = todaySession.endTime
      ? new Date(todaySession.endTime).getTime()
      : new Date().getTime();
    const duration = Math.floor((endTime - startTime) / 1000);

    const exercises = todaySession.exercises as LoggedExercise[];

    // ✅ Calcular recordes conquistados neste treino
    const records: ExerciseRecord[] = [];

    exercises.forEach((exercise) => {
      // Buscar histórico anterior (excluindo o treino de hoje)
      const previousExercises = state.loggedExercises.filter(
        (ex) =>
          ex.exerciseDefinitionId === exercise.exerciseDefinitionId &&
          ex.date.split("T")[0] !== today
      );

      if (previousExercises.length > 0) {
        // Verificar recorde de peso
        const previousMaxWeight = Math.max(
          ...previousExercises.map((ex) => ex.weight)
        );
        if (exercise.weight > previousMaxWeight) {
          const improvement = exercise.weight - previousMaxWeight;
          records.push({
            exerciseDefinitionId: exercise.exerciseDefinitionId,
            exerciseName: exercise.exerciseName,
            type: "weight",
            previousValue: previousMaxWeight,
            newValue: exercise.weight,
            improvement,
            improvementPercentage: (improvement / previousMaxWeight) * 100,
          });
        }

        // Verificar recorde de volume
        const previousMaxVolume = Math.max(
          ...previousExercises.map((ex) => ex.volume)
        );
        if (exercise.volume > previousMaxVolume) {
          const improvement = exercise.volume - previousMaxVolume;
          records.push({
            exerciseDefinitionId: exercise.exerciseDefinitionId,
            exerciseName: exercise.exerciseName,
            type: "volume",
            previousValue: previousMaxVolume,
            newValue: exercise.volume,
            improvement,
            improvementPercentage: (improvement / previousMaxVolume) * 100,
          });
        }
      }
    });

    return {
      workoutName: activeDay.name,
      exercises,
      duration,
      records,
    };
  }, [activeDay, allExercisesCompleted, state.workoutSessions, state.loggedExercises]);

  // ✅ Atualizar endTime quando todos os exercícios forem concluídos
  useEffect(() => {
    if (allExercisesCompleted && activeDay) {
      const today = new Date().toISOString().split("T")[0];
      const todaySession = state.workoutSessions.find(
        (session: WorkoutSession) => {
          const sessionDate = session.date.split("T")[0];
          return sessionDate === today && session.dayId === activeDay.id;
        }
      );

      if (todaySession && !todaySession.endTime) {
        const updatedSession: WorkoutSession = {
          ...todaySession,
          endTime: new Date().toISOString(),
        };

        dispatch({
          type: "UPDATE_WORKOUT_SESSION",
          payload: updatedSession,
        });
      }
    }
  }, [allExercisesCompleted, activeDay, state.workoutSessions, dispatch]);

  // ✅ VERIFICAR se o toast foi descartado para este dia
  const isToastDismissed =
    state.dismissedToasts[state.activeDayId || ""] || false;

  // ✅ Mostrar toast apenas se:
  // 1. Treino foi concluído
  // 2. Tem dados para compartilhar
  // 3. Modal não está aberto
  // 4. Toast não foi descartado para este dia
  const shouldShowToast =
    allExercisesCompleted &&
    workoutDataForSharing &&
    !showShareModal &&
    !isToastDismissed;

  const handleStartExercise = (exercise: PlannedExercise) => {
    dispatch({
      type: "SET_ACTIVE_EXERCISE",
      payload: exercise,
    });
  };

  const handleCompleteExercise = (loggedExercise: LoggedExercise) => {
    const enhancedLoggedExercise: LoggedExercise = {
      ...loggedExercise,
      isStrengthTraining,
    };

    dispatch({
      type: "LOG_EXERCISE",
      payload: enhancedLoggedExercise,
    });

    dispatch({
      type: "SET_ACTIVE_EXERCISE",
      payload: null,
    });
  };

  const handleCancelExecution = () => {
    dispatch({
      type: "SET_ACTIVE_EXERCISE",
      payload: null,
    });
  };

  const handleShareClick = () => {
    setShowShareModal(true);
  };

  const handleShareSuccess = () => {
    setShowShareModal(false);
    // ✅ Descartar toast após compartilhamento bem-sucedido
    dispatch({
      type: "DISMISS_TOAST",
      payload: state.activeDayId || "",
    });
    alert("Treino compartilhado com sucesso!");
  };

  const handleShareClose = () => {
    setShowShareModal(false);
  };

  const handleDismissToast = () => {
    // ✅ Descartar toast
    dispatch({
      type: "DISMISS_TOAST",
      payload: state.activeDayId || "",
    });
  };

  const handleReshareClick = () => {
    // ✅ Permitir compartilhar novamente
    dispatch({
      type: "RESET_TOAST",
      payload: state.activeDayId || "",
    });
    setShowShareModal(true);
  };

  // ✅ RENDERIZAR CONFIGURAÇÕES
  if (showSettings) {
    return <WorkoutSettings onClose={() => setShowSettings(false)} />;
  }

  // ✅ RENDERIZAR EXECUÇÃO
  if (executingExercise) {
    return (
      <ExerciseExecution
        exercise={executingExercise}
        onComplete={handleCompleteExercise}
        onCancel={handleCancelExecution}
        isStrengthTraining={isStrengthTraining}
      />
    );
  }

  return (
    <>
      <div className={styles.workoutTracker}>
        {/* ✅ HEADER SIMPLES COM BOTÃO DE CONFIGURAÇÕES */}
        <div className={styles.headerCard}>
          <div className={styles.headerContent}>
            <div className={styles.headerText}>
              <h2>💪 Treinos</h2>
              <p>Selecione um treino e execute seus exercícios</p>
            </div>
            <button
              className={styles.settingsButton}
              onClick={() => setShowSettings(true)}
              title="Configurar Treinos"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* ✅ NAVEGAÇÃO */}
        <WorkoutNavigation />

        {/* ✅ HEADER DO DIA COM TOGGLE INTEGRADO */}
        {activeDay && (
          <WorkoutDayHeader
            dayName={activeDay.name}
            isStrengthTraining={isStrengthTraining}
            onToggleTrainingType={setIsStrengthTraining}
            exerciseCount={activeDay.exercises.length}
          />
        )}

        {/* ✅ LISTA DE EXERCÍCIOS */}
        <ExerciseList
          onStartExercise={handleStartExercise}
          isStrengthTraining={isStrengthTraining}
        />

        {/* ✅ BOTÃO PARA COMPARTILHAR NOVAMENTE (se toast foi descartado) - NOVO DESIGN */}
        {allExercisesCompleted &&
          workoutDataForSharing &&
          isToastDismissed &&
          !showShareModal && (
            <div className={styles.reshareContainer}>
              <button
                onClick={handleReshareClick}
                className={styles.reshareButton}
                title="Compartilhar treino"
              >
                <span className={styles.reshareIcon}>📤</span>
                <div className={styles.reshareContent}>
                  <span className={styles.reshareTitle}>
                    Compartilhar Treino
                  </span>
                  <span className={styles.reshareSubtitle}>
                    {workoutDataForSharing.workoutName}
                  </span>
                </div>
              </button>
            </div>
          )}
      </div>

      {/* ✅ TOAST DE CONCLUSÃO DO TREINO */}
      {shouldShowToast && (
        <WorkoutCompletionToast
          isVisible={true}
          workoutName={workoutDataForSharing.workoutName}
          onShare={handleShareClick}
          onDismiss={handleDismissToast}
        />
      )}

      {/* ✅ MODAL DE COMPARTILHAMENTO */}
      {showShareModal && workoutDataForSharing && (
        <ShareWorkoutModal
          workoutName={workoutDataForSharing.workoutName}
          exercises={workoutDataForSharing.exercises}
          duration={workoutDataForSharing.duration}
          records={workoutDataForSharing.records}
          onClose={handleShareClose}
          onSuccess={handleShareSuccess}
        />
      )}
    </>
  );
}
