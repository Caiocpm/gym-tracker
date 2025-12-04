// src/components/WorkoutTracker/ExerciseExecution/ExerciseExecution.tsx
import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useWorkout } from "../../../contexts/WorkoutContext";
import { useTimerToast } from "../../../hooks/useTimerToast";
import { useNotifications } from "../../../hooks/useNotifications";
import { useAppNavigation } from "../../../contexts/AppNavigationContext";
import {
  useExerciseRecords,
  isNewWeightRecord,
  isNewVolumeRecord,
} from "../../../hooks/useExerciseRecords";
import { ConfirmationModal } from "../../UI/ConfirmationModal/ConfirmationModal";
import { RecordBadge } from "../RecordBadge/RecordBadge";
import type {
  PlannedExercise,
  ExecutedSet,
  ExerciseExecution,
  LoggedExercise,
  CurrentSetData,
} from "../../../types";
import styles from "./ExerciseExecution.module.css";

interface ExerciseExecutionProps {
  exercise: PlannedExercise;
  onComplete: (loggedExercise: LoggedExercise) => void;
  onCancel: () => void;
  isStrengthTraining?: boolean;
}

const generateExecutionId = () =>
  `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function ExerciseExecution({
  exercise,
  onComplete,
  onCancel,
  isStrengthTraining = false,
}: ExerciseExecutionProps) {
  const { state, dispatch } = useWorkout();
  const { notifyRestComplete, notifyExerciseComplete } = useNotifications();
  const { showToast } = useTimerToast();
  const { forceNavigateToWorkout } = useAppNavigation();

  // ✅ NOVO: Buscar recordes do exercício
  const exerciseRecords = useExerciseRecords(exercise.exerciseDefinitionId);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showWeightRecord, setShowWeightRecord] = useState(false);
  const [showVolumeRecord, setShowVolumeRecord] = useState(false);

  const savedProgress = state.exerciseProgress[exercise.id];

  console.log("🔍 ExerciseExecution renderizado para:", exercise.name);
  if (savedProgress) {
    console.log("🔄 Progresso salvo encontrado:", savedProgress);
  }

  useEffect(() => {
    console.log("🎯 Definindo exercício ativo:", exercise.name);
    dispatch({
      type: "SET_ACTIVE_EXERCISE",
      payload: exercise,
    });

    return () => {
      console.log("🧹 Limpando exercício ativo");
      dispatch({
        type: "SET_ACTIVE_EXERCISE",
        payload: null,
      });
    };
  }, [exercise, dispatch]);

  const [execution, setExecution] = useState<ExerciseExecution>(() => {
    if (savedProgress) {
      console.log("🔄 Restaurando progresso salvo para:", exercise.name);
      return savedProgress.execution;
    }

    return {
      id: generateExecutionId(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      startTime: new Date().toISOString(),
      currentSet: 1,
      totalSets: exercise.plannedSets,
      isActive: true,
      isPaused: false,
      completedSets: [],
      timerConfig: {
        defaultRestTime:
          exercise.plannedRestTime || (isStrengthTraining ? 180 : 90),
        autoStart: exercise.autoStartTimer ?? true,
        enableNotifications: true,
        enableSound: true,
        enableVibration: true,
      },
    };
  });

  const [currentSetData, setCurrentSetData] = useState<CurrentSetData>(() => {
    if (savedProgress) {
      console.log("🔄 Restaurando dados da série atual para:", exercise.name);
      return savedProgress.currentSetData;
    }

    return {
      reps: exercise.plannedReps,
      weight: exercise.plannedWeight,
      rpe: exercise.rpe || 7,
      notes: "",
    };
  });

  useEffect(() => {
    const hasProgress =
      execution.completedSets.length > 0 ||
      execution.currentSet > 1 ||
      currentSetData.reps !== exercise.plannedReps ||
      currentSetData.weight !== exercise.plannedWeight ||
      currentSetData.notes !== "";

    if (hasProgress) {
      console.log("💾 Salvando progresso para:", exercise.name);
      dispatch({
        type: "SAVE_EXERCISE_PROGRESS",
        payload: {
          exerciseId: exercise.id,
          execution,
          currentSetData,
        },
      });
    }
  }, [
    execution,
    currentSetData,
    exercise.id,
    exercise.name,
    exercise.plannedReps,
    exercise.plannedWeight,
    dispatch,
  ]);

  const navigateBackToExercise = useCallback(() => {
    console.log("🔄 Timer clicado - navegando de volta para:", exercise.name);

    forceNavigateToWorkout();

    dispatch({
      type: "SET_ACTIVE_EXERCISE",
      payload: exercise,
    });

    const exerciseDay = state.workoutDays.find((day) =>
      day.exercises.some((ex) => ex.id === exercise.id)
    );

    if (exerciseDay && state.activeDayId !== exerciseDay.id) {
      console.log("🔄 Mudando para o dia:", exerciseDay.name);
      dispatch({
        type: "SET_ACTIVE_DAY",
        payload: exerciseDay.id,
      });
    }

    console.log("✅ Navegação concluída - exercício ativo:", exercise.name);
  }, [
    exercise,
    dispatch,
    state.workoutDays,
    state.activeDayId,
    forceNavigateToWorkout,
  ]);

  const completeExercise = useCallback(
    (finalExecution: ExerciseExecution) => {
      console.log("🏁 Completando exercício:", exercise.name);

      // ✅ CORRIGIDO: Calcular reps MÉDIA por série, não TOTAL
      const avgRepsPerSet =
        finalExecution.completedSets.reduce((sum, set) => sum + set.reps, 0) /
        finalExecution.completedSets.length;

      const avgWeight =
        finalExecution.completedSets.reduce((sum, set) => sum + set.weight, 0) /
        finalExecution.completedSets.length;

      const totalVolume = finalExecution.completedSets.reduce(
        (sum, set) => sum + set.weight * set.reps,
        0
      );

      const rpeValues = finalExecution.completedSets
        .map((s) => s.rpe)
        .filter((rpe) => rpe !== undefined) as number[];
      const avgRPE =
        rpeValues.length > 0
          ? Math.round(
              rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length
            )
          : undefined;

      // ✅ Verificar se algum set bateu recorde
      const hasPersonalRecord = finalExecution.completedSets.some(
        (set) => set.isPersonalRecord
      );

      // ✅ NOVO: Adicionar completedSets com detalhes de cada série
      const loggedExercise: LoggedExercise = {
        id: `log-${Date.now()}`,
        workoutSessionId: "current-session",
        exerciseDefinitionId: exercise.exerciseDefinitionId,
        exerciseName: exercise.name,
        weight: Math.round(avgWeight * 10) / 10, // Arredondar para 1 casa decimal
        sets: finalExecution.completedSets.length,
        reps: Math.round(avgRepsPerSet), // ✅ Reps MÉDIA
        volume: totalVolume,
        date: new Date().toISOString(),
        dayId: state.activeDayId || "",
        notes: finalExecution.completedSets
          .map((s) => s.notes)
          .filter(Boolean)
          .join("; "),
        rpe: avgRPE,
        isStrengthTraining,
        isPersonalRecord: hasPersonalRecord, // ✅ Marcar se tem recorde!
        completedSets: finalExecution.completedSets.map((set) => ({
          setNumber: set.setNumber,
          reps: set.reps,
          weight: set.weight,
          rpe: set.rpe,
          notes: set.notes,
          completedAt: set.completedAt,
          isPersonalRecord: set.isPersonalRecord, // ✅ Passar o campo!
        })),
      };

      console.log("📝 LoggedExercise criado:", loggedExercise);

      dispatch({
        type: "MARK_EXERCISE_COMPLETED",
        payload: {
          exerciseId: exercise.id,
          loggedExercise,
        },
      });

      dispatch({
        type: "CLEAR_EXERCISE_PROGRESS",
        payload: exercise.id,
      });

      dispatch({
        type: "SET_ACTIVE_EXERCISE",
        payload: null,
      });

      notifyExerciseComplete(exercise.name);
      onComplete(loggedExercise);
    },
    [
      exercise,
      state.activeDayId,
      notifyExerciseComplete,
      onComplete,
      isStrengthTraining,
      dispatch,
    ]
  );

  const completeCurrentSet = useCallback(() => {
    console.log(
      "🎯 Completando série",
      execution.currentSet,
      "de",
      execution.totalSets
    );

    // ✅ Verificar se bateu recorde ANTES de criar o set
    const isWeightRecord = isNewWeightRecord(
      currentSetData.weight,
      exerciseRecords.maxWeight
    );
    const currentSetVolume = currentSetData.weight * currentSetData.reps;
    const previousMaxVolume = exerciseRecords.maxVolume;
    const isVolumeRecord = isNewVolumeRecord(
      currentSetVolume,
      previousMaxVolume
    );
    const isPersonalRecord = isWeightRecord || isVolumeRecord;

    const completedSet: ExecutedSet = {
      setNumber: execution.currentSet,
      reps: currentSetData.reps,
      weight: currentSetData.weight,
      rpe: currentSetData.rpe,
      notes: currentSetData.notes,
      completedAt: new Date().toISOString(),
      restTime: execution.timerConfig.defaultRestTime,
      isPersonalRecord, // ✅ Marcar se é recorde!
    };

    const updatedExecution = {
      ...execution,
      completedSets: [...execution.completedSets, completedSet],
      currentSet: execution.currentSet + 1,
    };

    setExecution(updatedExecution);

    // ✅ Mostrar badge se bateu recorde
    if (isWeightRecord) {
      console.log("🏆 NOVO RECORDE DE PESO!", {
        anterior: exerciseRecords.maxWeight,
        novo: currentSetData.weight,
      });
      setShowWeightRecord(true);
      setTimeout(() => setShowWeightRecord(false), 3000);
    }
    if (isNewVolumeRecord(currentSetVolume, previousMaxVolume)) {
      console.log("💪 NOVO RECORDE DE VOLUME!", {
        anterior: previousMaxVolume,
        novo: currentSetVolume,
      });
      setShowVolumeRecord(true);
      // Ocultar badge após 3 segundos
      setTimeout(() => setShowVolumeRecord(false), 3000);
    }

    if (execution.currentSet < execution.totalSets) {
      console.log(
        "⏭️ Não é a última série, autoStart:",
        execution.timerConfig.autoStart
      );

      if (execution.timerConfig.autoStart) {
        console.log("🚀 Criando timer toast...");

        const toastData = {
          id: `timer-${exercise.name}-${Date.now()}`,
          exerciseName: exercise.name,
          currentSet: updatedExecution.currentSet,
          totalSets: execution.totalSets,
          restTime: execution.timerConfig.defaultRestTime,
          startTime: Date.now(),
          onComplete: () => {
            console.log("✅ Timer de", exercise.name, "completado!");
            if (execution.timerConfig.enableNotifications) {
              notifyRestComplete();
            }
          },
          onReturnToExecution: navigateBackToExercise,
        };

        console.log("📤 Enviando toast:", toastData);
        showToast(toastData);
        console.log("✅ Toast enviado com sucesso!");
      } else {
        console.log("⏸️ AutoStart desabilitado");
      }

      setCurrentSetData({
        reps: exercise.plannedReps,
        weight: exercise.plannedWeight,
        rpe: exercise.rpe || 7,
        notes: "",
      });
    } else {
      console.log("🏁 Última série, finalizando exercício...");
      completeExercise(updatedExecution);
    }
  }, [
    execution,
    currentSetData,
    exercise,
    completeExercise,
    showToast,
    notifyRestComplete,
    navigateBackToExercise,
    exerciseRecords.maxWeight,
    exerciseRecords.maxVolume,
  ]);

  const skipCurrentSet = useCallback(() => {
    console.log("⏭️ Pulando série", execution.currentSet);

    const skippedSet: ExecutedSet = {
      setNumber: execution.currentSet,
      reps: 0,
      weight: 0,
      notes: "Série pulada",
      completedAt: new Date().toISOString(),
    };

    const updatedExecution = {
      ...execution,
      completedSets: [...execution.completedSets, skippedSet],
      currentSet: execution.currentSet + 1,
    };

    setExecution(updatedExecution);

    if (execution.currentSet < execution.totalSets) {
      setCurrentSetData({
        reps: exercise.plannedReps,
        weight: exercise.plannedWeight,
        rpe: exercise.rpe || 7,
        notes: "",
      });
    } else {
      completeExercise(updatedExecution);
    }
  }, [execution, exercise, completeExercise]);

  const handleCancel = () => {
    console.log("❓ Solicitando confirmação para cancelar:", exercise.name);
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    console.log("✅ Cancelamento confirmado - prosseguindo");
    console.log("❌ Cancelando execução de", exercise.name);

    dispatch({
      type: "CLEAR_EXERCISE_PROGRESS",
      payload: exercise.id,
    });

    dispatch({
      type: "SET_ACTIVE_EXERCISE",
      payload: null,
    });

    setShowCancelModal(false);
    onCancel();
  };

  const cancelCancel = () => {
    console.log("❌ Cancelamento cancelado pelo usuário");
    setShowCancelModal(false);
  };

  const getProgressDetails = () => {
    const details = [];

    if (execution.completedSets.length > 0) {
      details.push(`${execution.completedSets.length} série(s) completada(s)`);
    }

    if (execution.currentSet > 1) {
      details.push(
        `Progresso na série ${execution.currentSet} de ${execution.totalSets}`
      );
    }

    if (currentSetData.notes.trim()) {
      details.push("Notas da série atual");
    }

    if (currentSetData.weight !== exercise.plannedWeight) {
      details.push(`Peso ajustado para ${currentSetData.weight}kg`);
    }

    if (currentSetData.reps !== exercise.plannedReps) {
      details.push(`Repetições ajustadas para ${currentSetData.reps}`);
    }

    return details;
  };

  const hasProgress =
    execution.completedSets.length > 0 ||
    execution.currentSet > 1 ||
    currentSetData.reps !== exercise.plannedReps ||
    currentSetData.weight !== exercise.plannedWeight ||
    currentSetData.notes.trim() !== "";

  return createPortal(
    <div className={styles.modalOverlay} onClick={handleCancel}>
      <div
        className={styles.exerciseExecution}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.executionHeader}>
          <h2 className={styles.exerciseName}>{exercise.name}</h2>
          <div className={styles.progressInfo}>
            <span className={styles.setProgress}>
              Série {execution.currentSet} de {execution.totalSets}
            </span>
            <span className={styles.trainingType}>
              {isStrengthTraining ? "💪 Força" : "🏃 Resistência"}
            </span>
            {state.activeExercise?.id === exercise.id && (
              <span className={styles.activeIndicator}>Ativo</span>
            )}
            {savedProgress && (
              <span className={styles.progressIndicator}>
                📝 Progresso Salvo
              </span>
            )}
            <button className={styles.cancelButton} onClick={handleCancel}>
              ✕
            </button>
          </div>

          {/* ✅ NOVO: Informações de recordes */}
          {exerciseRecords.totalPerformances > 0 && (
            <div className={styles.recordsInfo}>
              <div className={styles.recordItem}>
                <span className={styles.recordLabel}>🏆 Melhor Peso:</span>
                <span className={styles.recordValue}>
                  {exerciseRecords.maxWeight.toFixed(1)}kg
                </span>
              </div>
              <div className={styles.recordItem}>
                <span className={styles.recordLabel}>💪 Melhor Volume:</span>
                <span className={styles.recordValue}>
                  {exerciseRecords.maxVolume.toFixed(0)}
                </span>
              </div>
              <div className={styles.recordItem}>
                <span className={styles.recordLabel}>📊 Vezes realizadas:</span>
                <span className={styles.recordValue}>
                  {exerciseRecords.totalPerformances}x
                </span>
              </div>
              {exerciseRecords.lastPerformed && (
                <div className={styles.recordItem}>
                  <span className={styles.recordLabel}>📅 Último treino:</span>
                  <span className={styles.recordValue}>
                    {new Date(
                      exerciseRecords.lastPerformed.date
                    ).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}
            </div>
          )}
        </header>

        {execution.currentSet <= execution.totalSets && (
          <div className={styles.currentSetForm}>
            <h3>Série {execution.currentSet}</h3>

            <div className={styles.inputGrid}>
              <div className={styles.inputGroup}>
                <label>Peso (kg)</label>
                <input
                  type="number"
                  value={currentSetData.weight}
                  onChange={(e) =>
                    setCurrentSetData((prev) => ({
                      ...prev,
                      weight: Number(e.target.value),
                    }))
                  }
                  onFocus={(e) => e.target.select()}
                  className={styles.numberInput}
                  step="0.5"
                  min="0"
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Repetições</label>
                <input
                  type="number"
                  value={currentSetData.reps}
                  onChange={(e) =>
                    setCurrentSetData((prev) => ({
                      ...prev,
                      reps: Number(e.target.value),
                    }))
                  }
                  onFocus={(e) => e.target.select()}
                  className={styles.numberInput}
                  min="1"
                />
              </div>

              <div className={styles.inputGroup}>
                <label>RPE (1-10)</label>
                <div className={styles.rpeButtons}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rpeValue) => (
                    <button
                      key={rpeValue}
                      type="button"
                      className={`${styles.rpeButton} ${
                        currentSetData.rpe === rpeValue ? styles.activeRpe : ""
                      }`}
                      onClick={() =>
                        setCurrentSetData((prev) => ({
                          ...prev,
                          rpe: rpeValue,
                        }))
                      }
                    >
                      {rpeValue}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Notas (opcional)</label>
              <textarea
                value={currentSetData.notes}
                onChange={(e) =>
                  setCurrentSetData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                className={styles.textArea}
                placeholder="Ex: Técnica boa, peso adequado..."
                rows={2}
              />
            </div>

            <div className={styles.actionButtons}>
              <button
                type="button"
                className={styles.completeSetButton}
                onClick={completeCurrentSet}
              >
                {execution.currentSet === execution.totalSets
                  ? "Finalizar Exercício"
                  : "Completar Série"}
              </button>

              <button
                type="button"
                className={styles.skipSetButton}
                onClick={skipCurrentSet}
              >
                Pular Série
              </button>
            </div>
          </div>
        )}

        <div className={styles.completedSets}>
          <h3>Séries Completadas</h3>
          {execution.completedSets.map((set, index) => (
            <div key={index} className={styles.completedSet}>
              <span className={styles.setNumber}>#{set.setNumber}</span>
              <span className={styles.setData}>
                {set.reps} reps × {set.weight}kg
              </span>
              {set.rpe !== undefined && (
                <span className={styles.rpe}>RPE: {set.rpe}</span>
              )}
              {set.restTime && (
                <span className={styles.restTime}>
                  Descanso: {Math.floor(set.restTime / 60)}:
                  {(set.restTime % 60).toString().padStart(2, "0")}
                </span>
              )}
              {set.notes && set.notes !== "Série pulada" && (
                <div className={styles.setNotes}>{set.notes}</div>
              )}
            </div>
          ))}
        </div>

        <ConfirmationModal
          isOpen={showCancelModal}
          title="Cancelar Exercício"
          message={`Tem certeza que deseja cancelar "${exercise.name}"?`}
          details={hasProgress ? getProgressDetails() : undefined}
          confirmText="Sim, Cancelar"
          cancelText="Continuar Exercício"
          onConfirm={confirmCancel}
          onCancel={cancelCancel}
          type="danger"
        />

        {/* ✅ NOVO: Badges de Recorde */}
        <RecordBadge
          type="weight"
          currentValue={currentSetData.weight}
          previousRecord={exerciseRecords.maxWeight}
          isVisible={showWeightRecord}
        />

        <RecordBadge
          type="volume"
          currentValue={currentSetData.weight * currentSetData.reps}
          previousRecord={exerciseRecords.maxVolume}
          isVisible={showVolumeRecord}
        />
      </div>
    </div>,
    document.body
  );
}
