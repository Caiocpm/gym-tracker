// src/components/UI/ConfirmationModal/ConfirmationModal.tsx
import { useEffect } from "react";
import styles from "./ConfirmationModal.module.css";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string[];
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
  type?: "warning" | "danger" | "info";
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  details,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  type = "warning",
}: ConfirmationModalProps) {
  // ✅ Fechar modal com ESC e bloquear scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div
        className={`${styles.modalContent} ${styles[type]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button
            className={styles.closeButton}
            onClick={onCancel}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.modalMessage}>{message}</p>

          {details && details.length > 0 && (
            <div className={styles.modalDetails}>
              <p className={styles.detailsTitle}>
                ⚠️ Progresso que será perdido:
              </p>
              <ul className={styles.detailsList}>
                {details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
              <p className={styles.warningText}>
                Esta ação não pode ser desfeita.
              </p>
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelButton} onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`${styles.confirmButton} ${
              styles[`confirm${type.charAt(0).toUpperCase() + type.slice(1)}`]
            }`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
