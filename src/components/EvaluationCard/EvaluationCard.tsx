// src/components/EvaluationCard/EvaluationCard.tsx
import type { EvaluationSchedule, StudentLink } from "../../types/professional";
import {
  EVALUATION_TYPE_LABELS,
  EVALUATION_STATUS_LABELS,
} from "../../types/professional";
import styles from "./EvaluationCard.module.css";

interface EvaluationCardProps {
  evaluation: EvaluationSchedule;
  student: StudentLink;
  onEdit: (evaluation: EvaluationSchedule) => void;
  onDelete: (evaluationId: string) => void;
  onViewResult?: (evaluationId: string) => void;
}

export function EvaluationCard({
  evaluation,
  student,
  onEdit,
  onDelete,
  onViewResult,
}: EvaluationCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string, timeString: string) => {
    const date = formatDate(dateString);
    return `${date} às ${timeString}`;
  };

  const getStatusColor = () => {
    const colors: Record<string, string> = {
      scheduled: "#3498DB",
      completed: "#27AE60",
      cancelled: "#E74C3C",
      rescheduled: "#F39C12",
    };
    return colors[evaluation.status] || "#3498DB";
  };

  const getStatusIcon = () => {
    const icons: Record<string, string> = {
      scheduled: "⏳",
      completed: "✅",
      cancelled: "❌",
      rescheduled: "🔄",
    };
    return icons[evaluation.status] || "📋";
  };

  const isPast = new Date(evaluation.scheduledDate) < new Date();
  const isScheduledAndPast = evaluation.status === "scheduled" && isPast;

  return (
    <div className={styles.evaluationCard}>
      <div className={styles.cardHeader}>
        <div className={styles.studentInfo}>
          <h3 className={styles.studentName}>
            {student.studentName || student.studentEmail || "Aluno"}
          </h3>
          <span className={styles.type}>
            {EVALUATION_TYPE_LABELS[evaluation.type]}
          </span>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={() => onEdit(evaluation)}
            title="Editar avaliação"
            aria-label="Editar avaliação"
          >
            ✏️
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => onDelete(evaluation.id)}
            title="Deletar avaliação"
            aria-label="Deletar avaliação"
          >
            🗑️
          </button>
        </div>
      </div>

      <h4 className={styles.evaluationTitle}>{evaluation.title}</h4>

      {evaluation.description && (
        <p className={styles.evaluationDescription}>{evaluation.description}</p>
      )}

      <div className={styles.infoSection}>
        <div className={styles.infoItem}>
          <span className={styles.icon}>📅</span>
          <span className={styles.text}>
            {formatDateTime(evaluation.scheduledDate, evaluation.scheduledTime)}
          </span>
        </div>

        {evaluation.location && (
          <div className={styles.infoItem}>
            <span className={styles.icon}>📍</span>
            <span className={styles.text}>{evaluation.location}</span>
          </div>
        )}

        {evaluation.duration && (
          <div className={styles.infoItem}>
            <span className={styles.icon}>⏱️</span>
            <span className={styles.text}>{evaluation.duration} minutos</span>
          </div>
        )}
      </div>

      {evaluation.notes && (
        <div className={styles.notesSection}>
          <p className={styles.notes}>{evaluation.notes}</p>
        </div>
      )}

      <div className={styles.cardFooter}>
        <span
          className={styles.statusBadge}
          style={{ backgroundColor: getStatusColor() }}
        >
          {getStatusIcon()} {EVALUATION_STATUS_LABELS[evaluation.status]}
        </span>

        {evaluation.status === "completed" && onViewResult && (
          <button
            className={styles.resultBtn}
            onClick={() => onViewResult(evaluation.id)}
            title="Visualizar resultado"
          >
            📊 Ver Resultado
          </button>
        )}

        {isScheduledAndPast && (
          <span className={styles.overdueWarning}>⚠️ Avaliação atrasada</span>
        )}
      </div>
    </div>
  );
}
