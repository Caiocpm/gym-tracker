// src/components/WorkoutTracker/WorkoutSettings/WorkoutSettings.tsx
import { useState } from "react";
import { createPortal } from "react-dom";
import { useWorkout } from "../../../contexts/WorkoutContext";
import type { WorkoutDay, PlannedExercise, ExerciseDefinition } from "../../../types";
import styles from "./WorkoutSettings.module.css";

interface WorkoutSettingsProps {
  onClose: () => void;
}

type Tab = "overview";
type EditMode = "workout" | "exercise" | null;

const DAY_LABELS = ["A", "B", "C", "D", "E", "F", "G"];

export function WorkoutSettings({ onClose }: WorkoutSettingsProps) {
  const { state, dispatch } = useWorkout();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutDay | null>(null);
  const [editingExercise, setEditingExercise] = useState<PlannedExercise | null>(null);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);

  // Filtros para o banco de exercícios
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMuscleGroup, setFilterMuscleGroup] = useState<string>("all");
  const [filterEquipment, setFilterEquipment] = useState<string>("all");

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getDayLabel = (dayId: string) => {
    const dayIndex = state.workoutDays.findIndex((day) => day.id === dayId);
    return dayIndex !== -1 ? DAY_LABELS[dayIndex] : dayId;
  };

  const getNextDayLabel = () => {
    return DAY_LABELS[state.workoutDays.length] || `Treino ${state.workoutDays.length + 1}`;
  };

  const generateWorkoutId = () => {
    return `workout-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  };

  const generateExerciseId = () => {
    return `ex-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  };

  // Obter grupos musculares únicos
  const muscleGroups = Array.from(
    new Set(state.exerciseDefinitions.map((ex) => ex.primaryMuscleGroup))
  ).sort();

  // Obter equipamentos únicos
  const equipmentTypes = Array.from(
    new Set(state.exerciseDefinitions.map((ex) => ex.equipment))
  ).sort();

  // Filtrar exercícios
  const filteredExercises = state.exerciseDefinitions.filter((exercise) => {
    const matchesSearch = exercise.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesMuscle =
      filterMuscleGroup === "all" ||
      exercise.primaryMuscleGroup === filterMuscleGroup;
    const matchesEquipment =
      filterEquipment === "all" || exercise.equipment === filterEquipment;

    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  // ============================================================================
  // WORKOUT CRUD OPERATIONS
  // ============================================================================

  const handleAddWorkout = () => {
    const newWorkout: WorkoutDay = {
      id: generateWorkoutId(),
      name: `Treino ${getNextDayLabel()}`,
      exercises: [],
    };
    setEditingWorkout(newWorkout);
    setEditMode("workout");
  };

  const handleEditWorkout = (workout: WorkoutDay) => {
    setEditingWorkout({ ...workout });
    setEditMode("workout");
  };

  const handleSaveWorkout = () => {
    if (!editingWorkout) return;

    if (state.workoutDays.find((d) => d.id === editingWorkout.id)) {
      // Atualizar existente
      dispatch({
        type: "UPDATE_WORKOUT_DAY",
        payload: editingWorkout,
      });
    } else {
      // Adicionar novo
      dispatch({
        type: "ADD_WORKOUT_DAY",
        payload: editingWorkout,
      });
    }

    setEditingWorkout(null);
    setEditMode(null);
  };

  const handleDeleteWorkout = (dayId: string) => {
    if (state.workoutDays.length <= 1) {
      alert("Você precisa ter pelo menos 1 treino!");
      return;
    }

    const workout = state.workoutDays.find((d) => d.id === dayId);
    if (
      window.confirm(
        `Tem certeza que deseja excluir "${workout?.name}"?\n\nIsso removerá ${workout?.exercises.length} exercícios.`
      )
    ) {
      dispatch({
        type: "DELETE_WORKOUT_DAY",
        payload: dayId,
      });
    }
  };

  const handleCancelEditWorkout = () => {
    setEditingWorkout(null);
    setEditMode(null);
  };

  // ============================================================================
  // EXERCISE CRUD OPERATIONS (dentro de um treino)
  // ============================================================================

  const handleAddExerciseToWorkout = (workoutId: string) => {
    setEditingWorkoutId(workoutId);
    const newExercise: PlannedExercise = {
      id: generateExerciseId(),
      exerciseDefinitionId: "",
      name: "",
      plannedSets: 3,
      plannedReps: 10,
      plannedWeight: 0,
      notes: "",
      createdAt: new Date().toISOString(),
      plannedRestTime: 90,
      autoStartTimer: true,
      isStrengthTraining: true,
      useAdvancedMetrics: false,
    };
    setEditingExercise(newExercise);
    setEditMode("exercise");
  };

  const handleSaveExercise = () => {
    if (!editingExercise || !editingWorkoutId) return;

    if (!editingExercise.exerciseDefinitionId) {
      alert("Por favor, selecione um exercício da lista!");
      return;
    }

    const workout = state.workoutDays.find((d) => d.id === editingWorkoutId);
    if (!workout) return;

    const exerciseExists = workout.exercises.find(
      (e) => e.id === editingExercise.id
    );

    if (exerciseExists) {
      // Atualizar existente
      dispatch({
        type: "UPDATE_PLANNED_EXERCISE",
        payload: {
          dayId: editingWorkoutId,
          exerciseId: editingExercise.id,
          exercise: editingExercise,
        },
      });
    } else {
      // Adicionar novo
      dispatch({
        type: "ADD_PLANNED_EXERCISE",
        payload: {
          dayId: editingWorkoutId,
          exercise: editingExercise,
        },
      });
    }

    setEditingExercise(null);
    setEditingWorkoutId(null);
    setEditMode(null);
  };

  const handleCancelEditExercise = () => {
    setEditingExercise(null);
    setEditingWorkoutId(null);
    setEditMode(null);
  };

  const handleSelectExerciseFromLibrary = (exerciseDef: ExerciseDefinition) => {
    if (!editingExercise) return;

    setEditingExercise({
      ...editingExercise,
      exerciseDefinitionId: exerciseDef.id,
      name: exerciseDef.name,
    });
  };

  // ============================================================================
  // RENDER MODALS
  // ============================================================================

  const renderWorkoutEditModal = () => {
    if (!editingWorkout || editMode !== "workout") return null;

    // Calcular padding baseado no scroll para centralizar o modal
    const scrollY = window.scrollY || window.pageYOffset;
    const viewportHeight = window.innerHeight;
    const modalPaddingTop = Math.max(20, scrollY + (viewportHeight * 0.05));

    return createPortal(
      <div className={styles.modalOverlay} onClick={handleCancelEditWorkout} style={{ paddingTop: `${modalPaddingTop}px` }}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3>
              {state.workoutDays.find((d) => d.id === editingWorkout.id)
                ? "✏️ Editar Treino"
                : "➕ Novo Treino"}
            </h3>
            <button
              className={styles.closeButton}
              onClick={handleCancelEditWorkout}
            >
              ✕
            </button>
          </div>

          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label>Nome do Treino</label>
              <input
                type="text"
                value={editingWorkout.name}
                onChange={(e) =>
                  setEditingWorkout({ ...editingWorkout, name: e.target.value })
                }
                placeholder="Ex: Treino A - Peito e Tríceps"
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label>Exercícios ({editingWorkout.exercises.length})</label>
              <div className={styles.exercisesList}>
                {editingWorkout.exercises.map((exercise, index) => (
                  <div key={exercise.id} className={styles.exerciseItem}>
                    <span className={styles.exerciseNumber}>{index + 1}</span>
                    <span className={styles.exerciseName}>{exercise.name}</span>
                    <span className={styles.exerciseDetails}>
                      {exercise.plannedSets}×{exercise.plannedReps} @ {exercise.plannedWeight}kg
                    </span>
                  </div>
                ))}
                {editingWorkout.exercises.length === 0 && (
                  <p className={styles.emptyMessage}>
                    Nenhum exercício adicionado ainda.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              className={styles.cancelButton}
              onClick={handleCancelEditWorkout}
            >
              Cancelar
            </button>
            <button className={styles.saveButton} onClick={handleSaveWorkout}>
              💾 Salvar
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const renderExerciseEditModal = () => {
    if (!editingExercise || editMode !== "exercise") return null;

    const isNew = !state.workoutDays
      .find((d) => d.id === editingWorkoutId)
      ?.exercises.find((e) => e.id === editingExercise.id);

    // Calcular padding baseado no scroll para centralizar o modal
    const scrollY = window.scrollY || window.pageYOffset;
    const viewportHeight = window.innerHeight;
    const modalPaddingTop = Math.max(20, scrollY + (viewportHeight * 0.05));

    return createPortal(
      <div className={styles.modalOverlay} onClick={handleCancelEditExercise} style={{ paddingTop: `${modalPaddingTop}px` }}>
        <div className={`${styles.modalContent} ${styles.largeModal}`} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3>{isNew ? "➕ Adicionar Exercício" : "✏️ Editar Exercício"}</h3>
            <button
              className={styles.closeButton}
              onClick={handleCancelEditExercise}
            >
              ✕
            </button>
          </div>

          <div className={styles.modalBody}>
            {/* Seleção de Exercício da Biblioteca */}
            <div className={styles.formGroup}>
              <label>Exercício Selecionado</label>
              <div className={styles.selectedExercise}>
                {editingExercise.exerciseDefinitionId ? (
                  <div className={styles.selectedInfo}>
                    <span className={styles.selectedName}>
                      ✅ {editingExercise.name}
                    </span>
                    <button
                      className={styles.changeButton}
                      onClick={() =>
                        setEditingExercise({
                          ...editingExercise,
                          exerciseDefinitionId: "",
                          name: "",
                        })
                      }
                    >
                      Trocar
                    </button>
                  </div>
                ) : (
                  <p className={styles.noSelection}>
                    ⚠️ Selecione um exercício abaixo
                  </p>
                )}
              </div>
            </div>

            {/* Biblioteca de Exercícios */}
            {!editingExercise.exerciseDefinitionId && (
              <div className={styles.exerciseLibrary}>
                <h4>📚 Biblioteca de Exercícios</h4>

                {/* Filtros */}
                <div className={styles.filters}>
                  <input
                    type="text"
                    placeholder="🔍 Buscar exercício..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                  />

                  <select
                    value={filterMuscleGroup}
                    onChange={(e) => setFilterMuscleGroup(e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="all">Todos os Grupos</option>
                    {muscleGroups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterEquipment}
                    onChange={(e) => setFilterEquipment(e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="all">Todos Equipamentos</option>
                    {equipmentTypes.map((equipment) => (
                      <option key={equipment} value={equipment}>
                        {equipment}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contador de Resultados */}
                <div className={styles.resultsCount}>
                  {filteredExercises.length} exercício(s) encontrado(s)
                </div>

                {/* Lista de Exercícios */}
                <div className={styles.exerciseGrid}>
                  {filteredExercises.map((exerciseDef) => (
                    <div
                      key={exerciseDef.id}
                      className={styles.exerciseCard}
                      onClick={() => handleSelectExerciseFromLibrary(exerciseDef)}
                    >
                      <div className={styles.exerciseCardHeader}>
                        <strong>{exerciseDef.name}</strong>
                      </div>
                      <div className={styles.exerciseCardBody}>
                        <span className={styles.badge}>
                          💪 {exerciseDef.primaryMuscleGroup}
                        </span>
                        <span className={styles.badge}>
                          🏋️ {exerciseDef.equipment}
                        </span>
                      </div>
                    </div>
                  ))}
                  {filteredExercises.length === 0 && (
                    <p className={styles.emptyMessage}>
                      Nenhum exercício encontrado com esses filtros.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Configurações do Exercício */}
            {editingExercise.exerciseDefinitionId && (
              <div className={styles.exerciseConfig}>
                <h4>⚙️ Configurações</h4>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Séries Planejadas</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={editingExercise.plannedSets}
                      onChange={(e) =>
                        setEditingExercise({
                          ...editingExercise,
                          plannedSets: Number(e.target.value),
                        })
                      }
                      onFocus={(e) => e.target.select()}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Repetições Planejadas</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={editingExercise.plannedReps}
                      onChange={(e) =>
                        setEditingExercise({
                          ...editingExercise,
                          plannedReps: Number(e.target.value),
                        })
                      }
                      onFocus={(e) => e.target.select()}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Peso (kg)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={editingExercise.plannedWeight}
                      onChange={(e) =>
                        setEditingExercise({
                          ...editingExercise,
                          plannedWeight: Number(e.target.value),
                        })
                      }
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Tempo de Descanso (segundos)</label>
                    <input
                      type="number"
                      min="30"
                      max="300"
                      step="15"
                      value={editingExercise.plannedRestTime}
                      onChange={(e) =>
                        setEditingExercise({
                          ...editingExercise,
                          plannedRestTime: Number(e.target.value),
                        })
                      }
                      onFocus={(e) => e.target.select()}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>RPE Alvo</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={editingExercise.rpe || 7}
                      onChange={(e) =>
                        setEditingExercise({
                          ...editingExercise,
                          rpe: Number(e.target.value),
                        })
                      }
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Notas</label>
                  <textarea
                    value={editingExercise.notes}
                    onChange={(e) =>
                      setEditingExercise({
                        ...editingExercise,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Ex: Foco na técnica, amplitude completa..."
                    rows={3}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={editingExercise.autoStartTimer ?? true}
                      onChange={(e) =>
                        setEditingExercise({
                          ...editingExercise,
                          autoStartTimer: e.target.checked,
                        })
                      }
                    />
                    <span>⏱️ Iniciar timer automaticamente após série</span>
                  </label>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={editingExercise.useAdvancedMetrics ?? false}
                      onChange={(e) =>
                        setEditingExercise({
                          ...editingExercise,
                          useAdvancedMetrics: e.target.checked,
                        })
                      }
                    />
                    <span>📊 Usar métricas avançadas (RPE, velocidade, etc)</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button
              className={styles.cancelButton}
              onClick={handleCancelEditExercise}
            >
              Cancelar
            </button>
            <button
              className={styles.saveButton}
              onClick={handleSaveExercise}
              disabled={!editingExercise.exerciseDefinitionId}
            >
              💾 Salvar Exercício
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingsModal}>
        {/* Header */}
        <div className={styles.settingsHeader}>
          <h2>⚙️ Configurações de Treino</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tabs - Removida aba "Biblioteca de Exercícios" */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${styles.active}`}
            onClick={() => setActiveTab("overview")}
          >
            📊 Meus Treinos
          </button>
        </div>

        {/* Content */}
        <div className={styles.settingsContent}>
          {activeTab === "overview" && (
            <div className={styles.overviewTab}>
              <div className={styles.tabHeader}>
                <h3>Seus Treinos ({state.workoutDays.length})</h3>
                <button
                  className={styles.addWorkoutButton}
                  onClick={handleAddWorkout}
                >
                  ➕ Novo Treino
                </button>
              </div>

              <div className={styles.workoutGrid}>
                {state.workoutDays.map((day) => (
                  <div key={day.id} className={styles.workoutCard}>
                    <div className={styles.workoutCardHeader}>
                      <div className={styles.workoutLetter}>
                        {getDayLabel(day.id)}
                      </div>
                      <div className={styles.workoutInfo}>
                        <h4>{day.name}</h4>
                        <span className={styles.exerciseCount}>
                          {day.exercises.length} exercícios
                        </span>
                      </div>
                    </div>

                    <div className={styles.workoutCardBody}>
                      {day.exercises.length > 0 ? (
                        <ul className={styles.exercisePreview}>
                          {day.exercises.slice(0, 3).map((exercise) => (
                            <li key={exercise.id}>
                              <span className={styles.exercisePreviewName}>
                                {exercise.name}
                              </span>
                              <span className={styles.exercisePreviewDetails}>
                                {exercise.plannedSets}×{exercise.plannedReps}
                              </span>
                            </li>
                          ))}
                          {day.exercises.length > 3 && (
                            <li className={styles.moreExercises}>
                              +{day.exercises.length - 3} mais
                            </li>
                          )}
                        </ul>
                      ) : (
                        <p className={styles.emptyWorkout}>
                          Nenhum exercício adicionado
                        </p>
                      )}
                    </div>

                    <div className={styles.workoutCardActions}>
                      <button
                        className={styles.editButton}
                        onClick={() => handleEditWorkout(day)}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className={styles.manageButton}
                        onClick={() => handleAddExerciseToWorkout(day.id)}
                      >
                        ➕ Adicionar Exercício
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteWorkout(day.id)}
                        disabled={state.workoutDays.length <= 1}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {state.workoutDays.length < 7 && (
                <div className={styles.addWorkoutSection}>
                  <button
                    className={styles.addWorkoutButtonLarge}
                    onClick={handleAddWorkout}
                  >
                    ➕ Adicionar Novo Treino
                  </button>
                  <p className={styles.hint}>
                    Você pode criar até {7 - state.workoutDays.length} treinos adicionais
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.settingsFooter}>
          <button className={styles.closeButtonLarge} onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>

      {/* Modals */}
      {renderWorkoutEditModal()}
      {renderExerciseEditModal()}
    </div>
  );
}
