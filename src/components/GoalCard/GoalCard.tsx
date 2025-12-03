// src/components/GoalCard/GoalCard.tsx
import type { StudentGoal, StudentLink } from "../../types/professional";
import {
  GOAL_CATEGORY_LABELS,
  GOAL_STATUS_LABELS,
} from "../../types/professional";
import styles from "./GoalCard.module.css";

interface GoalCardProps {
  goal: StudentGoal;
  student: StudentLink;
  onEdit: (goal: StudentGoal) => void;
  onDelete: (goalId: string) => void;
  onMarkComplete: (goalId: string) => void;
}

export function GoalCard({
  goal,
  student,
  onEdit,
  onDelete,
  onMarkComplete,
}: GoalCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const calculateProgress = () => {
    if (goal.targetValue === goal.startValue) return 0;
    const progress = Math.min(
      100,
      Math.max(
        0,
        ((goal.currentValue - goal.startValue) /
          (goal.targetValue - goal.startValue)) *
          100
      )
    );
    return Math.round(progress);
  };

  const isOverdue = () => {
    return new Date() > new Date(goal.targetDate);
  };

  const getStatusColor = () => {
    if (goal.status === "completed") return "#27AE60";
    if (goal.status === "paused") return "#F39C12";
    if (goal.status === "failed") return "#E74C3C";
    if (isOverdue() && goal.status === "active") return "#E74C3C";
    return "#45B7D1";
  };

  const getStatusLabel = () => {
    if (isOverdue() && goal.status === "active") return "Atrasada";
    return GOAL_STATUS_LABELS[goal.status];
  };

  const progress = calculateProgress();

  return (
    <div className={styles.goalCard}>
      <div className={styles.cardHeader}>
        <div className={styles.studentInfo}>
          <h3 className={styles.studentName}>
            {student.studentName || student.studentEmail || "Aluno"}
          </h3>
          <span className={styles.category}>
            {GOAL_CATEGORY_LABELS[goal.category]}
          </span>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={() => onEdit(goal)}
            title="Editar meta"
            aria-label="Editar meta"
          >
            ✏️
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => onDelete(goal.id)}
            title="Deletar meta"
            aria-label="Deletar meta"
          >
            🗑️
          </button>
        </div>
      </div>

      <h4 className={styles.goalTitle}>{goal.title}</h4>

      {goal.description && (
        <p className={styles.goalDescription}>{goal.description}</p>
      )}

      <div className={styles.progressSection}>
        <div className={styles.progressInfo}>
          <span className={styles.values}>
            {goal.currentValue} / {goal.targetValue} {goal.unit}
          </span>
          <span className={styles.percentage}>{progress}%</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.fill} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.dateInfo}>
          <span className={styles.label}>Prazo:</span>
          <span className={styles.date}>{formatDate(goal.targetDate)}</span>
        </div>
        <span
          className={styles.statusBadge}
          style={{ backgroundColor: getStatusColor() }}
        >
          {getStatusLabel()}
        </span>
        {goal.status === "active" && (
          <button
            className={styles.completeBtn}
            onClick={() => onMarkComplete(goal.id)}
            title="Marcar como concluída"
          >
            ✅ Completar
          </button>
        )}
      </div>
    </div>
  );
}
