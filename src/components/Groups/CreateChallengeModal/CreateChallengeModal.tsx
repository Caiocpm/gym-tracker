// src/components/Groups/CreateChallengeModal/CreateChallengeModal.tsx
import { useState } from "react";
import type { ChallengeType } from "../../../types/social";
import { exerciseDefinitions } from "../../../data/exerciseDefinitions";
import styles from "./CreateChallengeModal.module.css";

interface CreateChallengeModalProps {
  groupId: string;
  onClose: () => void;
  onSubmit: (challengeData: {
    title: string;
    description: string;
    type: ChallengeType;
    targetValue: number;
    targetUnit: string;
    startDate: Date;
    endDate: Date;
    isCompetitive: boolean;
    reward?: string;
    exerciseId?: string;
    exerciseName?: string;
  }) => Promise<void>;
}

export function CreateChallengeModal({
  onClose,
  onSubmit,
}: CreateChallengeModalProps) {
  const [type, setType] = useState<ChallengeType>("volume");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCompetitive, setIsCompetitive] = useState(false);
  const [reward, setReward] = useState("");
  const [exerciseId, setExerciseId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Templates pré-definidos
  const applyTemplate = (templateType: ChallengeType) => {
    setType(templateType);

    const today = new Date();
    const start = new Date(today);
    const end = new Date(today);
    end.setDate(end.getDate() + 30); // 30 dias por padrão

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);

    switch (templateType) {
      case "volume":
        setTitle("Desafio de Volume");
        setDescription("Levante o máximo de peso total possível!");
        setTargetValue("50000");
        setIsCompetitive(true);
        setReward("Badge de Força 💪");
        break;
      case "consistency":
        setTitle("Desafio de Consistência");
        setDescription("Cada um treina no seu ritmo! Meta: treinar X dias no período.");
        setTargetValue("15");
        setIsCompetitive(false);
        setReward("Badge de Disciplina 🔥");
        break;
      case "records":
        setTitle("Caçador de Recordes");
        setDescription("Bata o máximo de recordes pessoais!");
        setTargetValue("5");
        setIsCompetitive(true);
        setReward("Badge de Campeão 🏆");
        break;
      case "exercise":
        setTitle("Desafio de Exercício");
        setDescription("Melhore seu desempenho em um exercício específico!");
        setTargetValue("10");
        setIsCompetitive(true);
        setReward("Badge de Progresso 📈");
        break;
      case "collaborative":
        setTitle("Desafio Coletivo");
        setDescription("Juntos somos mais fortes! Meta do grupo:");
        setTargetValue("500000");
        setIsCompetitive(false);
        setReward("Badge de Equipe 👥");
        break;
    }
  };

  // ✅ Obter unidade baseada no tipo
  const getTargetUnit = (): string => {
    switch (type) {
      case "volume":
        return "kg";
      case "consistency":
        return "dias";
      case "records":
        return "recordes";
      case "exercise":
        return "kg";
      case "collaborative":
        return "kg";
      default:
        return "";
    }
  };

  // ✅ Validação
  const isValid = (): boolean => {
    if (!title || !description || !targetValue || !startDate || !endDate) {
      return false;
    }
    if (parseFloat(targetValue) <= 0) {
      return false;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      return false;
    }
    if (type === "exercise" && !exerciseId) {
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid()) {
      alert("Preencha todos os campos obrigatórios corretamente");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedExercise = exerciseId
        ? exerciseDefinitions.find((ex) => ex.id === exerciseId)
        : undefined;

      await onSubmit({
        title,
        description,
        type,
        targetValue: parseFloat(targetValue),
        targetUnit: getTargetUnit(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCompetitive,
        reward: reward || undefined,
        exerciseId: exerciseId || undefined,
        exerciseName: selectedExercise?.name || undefined,
      });

      onClose();
    } catch (error) {
      console.error("Erro ao criar desafio:", error);
      alert("Erro ao criar desafio. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2>🎯 Criar Novo Desafio</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Templates Rápidos */}
          <div className={styles.templatesSection}>
            <label>Templates Rápidos:</label>
            <div className={styles.templates}>
              {(["volume", "consistency", "records", "exercise", "collaborative"] as ChallengeType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`${styles.templateButton} ${type === t ? styles.active : ""}`}
                  onClick={() => applyTemplate(t)}
                >
                  {t === "volume" && "🏋️ Volume"}
                  {t === "consistency" && "🔥 Consistência"}
                  {t === "records" && "🏆 Recordes"}
                  {t === "exercise" && "💪 Exercício"}
                  {t === "collaborative" && "👥 Coletivo"}
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div className={styles.formGroup}>
            <label htmlFor="title">Título do Desafio *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Desafio de Volume 30 Dias"
              required
            />
          </div>

          {/* Descrição */}
          <div className={styles.formGroup}>
            <label htmlFor="description">Descrição *</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o desafio e as regras..."
              rows={3}
              required
            />
          </div>

          {/* Exercício Específico (apenas para tipo "exercise") */}
          {type === "exercise" && (
            <div className={styles.formGroup}>
              <label htmlFor="exerciseId">Exercício *</label>
              <select
                id="exerciseId"
                value={exerciseId}
                onChange={(e) => setExerciseId(e.target.value)}
                required
              >
                <option value="">Selecione um exercício</option>
                {exerciseDefinitions.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Meta */}
          <div className={styles.formGroup}>
            <label htmlFor="targetValue">
              Meta * ({getTargetUnit()})
            </label>
            <input
              id="targetValue"
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder={`Ex: ${type === "volume" ? "50000" : type === "consistency" ? "20" : "5"}`}
              min="0.01"
              step="any"
              required
            />
            <small className={styles.hint}>
              {type === "volume" && "Volume total em kg a ser levantado"}
              {type === "consistency" && "Número de dias de treino (cada um no seu ritmo)"}
              {type === "records" && "Quantidade de recordes a bater"}
              {type === "exercise" && "Melhoria no peso (kg) para o exercício"}
              {type === "collaborative" && "Meta coletiva do grupo em kg"}
            </small>
          </div>

          {/* Período */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="startDate">Data de Início *</label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="endDate">Data de Término *</label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Competitivo */}
          <div className={styles.formGroup}>
            <div className={styles.checkbox}>
              <input
                id="isCompetitive"
                type="checkbox"
                checked={isCompetitive}
                onChange={(e) => setIsCompetitive(e.target.checked)}
              />
              <label htmlFor="isCompetitive">
                Desafio Competitivo (Ranking)
              </label>
            </div>
            <small className={styles.hint}>
              Se marcado, mostrará um ranking dos participantes
            </small>
          </div>

          {/* Recompensa */}
          <div className={styles.formGroup}>
            <label htmlFor="reward">Recompensa (opcional)</label>
            <input
              id="reward"
              type="text"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              placeholder="Ex: Badge de Campeão 🏆"
            />
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
              disabled={isSubmitting || !isValid()}
            >
              {isSubmitting ? "Criando..." : "Criar Desafio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
