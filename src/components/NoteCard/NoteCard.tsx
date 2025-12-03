// src/components/NoteCard/NoteCard.tsx
import type { StudentNote, StudentLink } from "../../types/professional";
import { NOTE_CATEGORY_LABELS } from "../../types/professional";
import styles from "./NoteCard.module.css";

interface NoteCardProps {
  note: StudentNote;
  student: StudentLink;
  onEdit: (note: StudentNote) => void;
  onDelete: (noteId: string) => void;
}

export function NoteCard({ note, student, onEdit, onDelete }: NoteCardProps) {
  const truncateContent = (text: string, maxLength: number = 150) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + "...";
    }
    return text;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getCategoryColor = (category: typeof note.category) => {
    const colors: Record<string, string> = {
      progress: "#45B7D1",
      health: "#FF6B6B",
      behavior: "#FFA07A",
      evaluation: "#F7DC6F",
      other: "#98D8C8",
    };
    return colors[category] || "#45B7D1";
  };

  return (
    <div className={styles.noteCard}>
      <div className={styles.cardHeader}>
        <div className={styles.studentInfo}>
          <h3 className={styles.studentName}>
            {student.studentName || student.studentEmail || "Aluno"}
          </h3>
          <span className={styles.date}>{formatDate(note.createdAt)}</span>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={() => onEdit(note)}
            title="Editar anotação"
            aria-label="Editar anotação"
          >
            ✏️
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => onDelete(note.id)}
            title="Deletar anotação"
            aria-label="Deletar anotação"
          >
            🗑️
          </button>
        </div>
      </div>

      {note.title && <h4 className={styles.noteTitle}>{note.title}</h4>}

      <p className={styles.noteContent}>{truncateContent(note.content)}</p>

      <div className={styles.cardFooter}>
        <span
          className={styles.categoryBadge}
          style={{ backgroundColor: getCategoryColor(note.category) }}
        >
          {NOTE_CATEGORY_LABELS[note.category]}
        </span>
      </div>
    </div>
  );
}
