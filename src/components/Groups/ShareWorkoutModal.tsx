// src/components/Groups/ShareWorkoutModal.tsx
import { useState, useMemo } from "react";
import { useGroups } from "../../hooks/useGroups";
import type { LoggedExercise } from "../../types";
import type { ExerciseRecord } from "../../types/social";
import styles from "./Groups.module.css";

interface ShareWorkoutModalProps {
  workoutName: string;
  exercises: LoggedExercise[]; // ✅ CORRIGIDO: Usar LoggedExercise
  duration: number; // in seconds
  records?: ExerciseRecord[]; // ✅ NOVO: Recordes conquistados neste treino
  onClose: () => void;
  onSuccess: () => void;
}

export function ShareWorkoutModal({
  workoutName,
  exercises,
  duration,
  records = [],
  onClose,
  onSuccess,
}: ShareWorkoutModalProps) {
  const { myGroups, createPost } = useGroups();
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [caption, setCaption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Auto-gerar legenda sugerida com recordes
  const suggestedCaption = useMemo(() => {
    if (records.length === 0) return "";

    const recordTexts = records.map((record) => {
      const emoji = record.type === "weight" ? "🏆" : "💪";
      return `${emoji} Novo recorde em ${record.exerciseName}: ${record.newValue.toFixed(1)}${record.type === "weight" ? "kg" : " vol"} (+${record.improvementPercentage.toFixed(1)}%)`;
    });

    return recordTexts.join("\n");
  }, [records]);

  const toggleGroup = (groupId: string) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId);
    } else {
      newSelected.add(groupId);
    }
    setSelectedGroups(newSelected);
  };

  const calculateTotalVolume = () => {
    return exercises.reduce((total, exercise) => total + exercise.volume, 0);
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedGroups.size === 0) {
      alert("Selecione pelo menos um grupo para compartilhar");
      return;
    }

    setIsSubmitting(true);

    try {
      const totalVolume = calculateTotalVolume();
      const workoutDate = new Date().toISOString();

      // ✅ CORRIGIDO: Transformar LoggedExercise em WorkoutPostExercise
      const postExercises = exercises.map((exercise) => {
        // Usar completedSets se disponível, caso contrário criar um array com a série resumida
        const sets =
          exercise.completedSets && exercise.completedSets.length > 0
            ? exercise.completedSets.map((set) => ({
                reps: set.reps,
                weight: set.weight,
              }))
            : [
                {
                  reps: exercise.reps,
                  weight: exercise.weight,
                },
              ];

        return {
          name: exercise.exerciseName,
          sets,
          totalVolume: exercise.volume,
        };
      });

      // Share to each selected group
      for (const groupId of Array.from(selectedGroups)) {
        const postData: {
          groupId: string;
          workoutName: string;
          workoutDate: string;
          duration: number;
          totalVolume: number;
          exercises: typeof postExercises;
          records?: ExerciseRecord[];
          likesCount: number;
          commentsCount: number;
          sharesCount: number;
          caption?: string;
        } = {
          groupId,
          workoutName,
          workoutDate,
          duration,
          totalVolume,
          exercises: postExercises,
          likesCount: 0,
          commentsCount: 0,
          sharesCount: 0,
        };

        // ✅ Adicionar recordes se houver
        if (records.length > 0) {
          postData.records = records;
        }

        // Só adicionar caption se não estiver vazio
        if (caption && caption.trim()) {
          postData.caption = caption.trim();
        }

        // ✅ Log para debug (remover depois de confirmar o funcionamento)
        console.log("📤 Dados sendo enviados para Firebase:", postData);

        await createPost(groupId, postData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error sharing workout:", error);
      alert("Erro ao compartilhar treino. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Compartilhar Treino</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleShare} className={styles.form}>
          {/* Workout Summary */}
          <div className={styles.formGroup}>
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
              {workoutName}
            </h3>
            <div style={{ fontSize: "0.875rem", color: "#718096" }}>
              <div>⏱️ {Math.floor(duration / 60)} minutos</div>
              <div>💪 {exercises.length} exercícios</div>
              <div>🏋️ {calculateTotalVolume().toFixed(0)} kg volume total</div>
              {records.length > 0 && (
                <div style={{ color: "#d4af37", fontWeight: 600 }}>
                  🏆 {records.length} {records.length === 1 ? "novo recorde" : "novos recordes"}!
                </div>
              )}
            </div>
          </div>

          {/* Records Highlight */}
          {records.length > 0 && (
            <div
              style={{
                background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
                padding: "1rem",
                borderRadius: "12px",
                marginBottom: "1rem",
                border: "2px solid #d4af37",
              }}
            >
              <div
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  marginBottom: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                🏆 Novos Recordes Conquistados!
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {records.map((record, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontSize: "0.8rem",
                      color: "#1a1a1a",
                      background: "rgba(255, 255, 255, 0.6)",
                      padding: "0.5rem",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>
                      {record.type === "weight" ? "🏆" : "💪"} {record.exerciseName}
                    </span>
                    <span style={{ fontWeight: 700, color: "#d4af37" }}>
                      {record.newValue.toFixed(1)}
                      {record.type === "weight" ? "kg" : " vol"} (+
                      {record.improvementPercentage.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exercise Preview */}
          <div
            style={{
              fontSize: "0.75rem",
              color: "#718096",
              background: "#f7fafc",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                marginBottom: "0.5rem",
                color: "#2d3748",
              }}
            >
              Exercícios a compartilhar:
            </div>
            {exercises.map((ex, idx) => {
              const hasRecord = records.some(
                (r) => r.exerciseDefinitionId === ex.exerciseDefinitionId
              );
              return (
                <div
                  key={idx}
                  style={{
                    marginBottom: "0.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span>
                    • {ex.exerciseName}: {ex.sets} séries, {ex.volume.toFixed(0)} kg
                  </span>
                  {hasRecord && (
                    <span style={{ fontSize: "0.9rem" }}>🏆</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Caption */}
          <div className={styles.formGroup}>
            <label htmlFor="caption">Legenda (opcional)</label>
            {suggestedCaption && caption === "" && (
              <button
                type="button"
                onClick={() => setCaption(suggestedCaption)}
                style={{
                  fontSize: "0.75rem",
                  color: "#4299e1",
                  background: "transparent",
                  border: "none",
                  padding: "0.25rem 0",
                  cursor: "pointer",
                  textDecoration: "underline",
                  marginBottom: "0.5rem",
                }}
              >
                ✨ Usar legenda sugerida com recordes
              </button>
            )}
            <textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={
                suggestedCaption
                  ? "Adicione uma descrição ou clique acima para usar a legenda sugerida..."
                  : "Adicione uma descrição sobre seu treino..."
              }
              rows={3}
            />
          </div>

          {/* Group Selection */}
          <div className={styles.formGroup}>
            <label>Compartilhar em:</label>
            {myGroups.length === 0 ? (
              <p style={{ fontSize: "0.875rem", color: "#718096" }}>
                Você ainda não faz parte de nenhum grupo. Crie ou entre em um
                grupo primeiro!
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  marginTop: "0.5rem",
                }}
              >
                {myGroups.map((group) => (
                  <label
                    key={group.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      background: selectedGroups.has(group.id)
                        ? "#f7fafc"
                        : "white",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroups.has(group.id)}
                      onChange={() => toggleGroup(group.id)}
                      style={{ width: "18px", height: "18px" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "#1a202c" }}>
                        {group.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#718096" }}>
                        {group.membersCount} membros
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || selectedGroups.size === 0}
            >
              {isSubmitting ? "Compartilhando..." : "Compartilhar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
