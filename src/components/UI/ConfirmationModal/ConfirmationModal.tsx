// src/components/UI/ConfirmationModal/ConfirmationModal.tsx
import { useEffect, useRef } from "react";
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
  const overlayRef = useRef<HTMLDivElement>(null);

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

  // ✅ CRÍTICO: Calcular viewport e posicionar modal
  useEffect(() => {
    if (isOpen && overlayRef.current) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // ✅ Obter posição atual do scroll
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const viewportHeight = window.innerHeight;

      // ✅ Aplicar posicionamento absoluto na página
      overlayRef.current.style.position = "absolute";
      overlayRef.current.style.top = `${scrollY}px`;
      overlayRef.current.style.left = "0";
      overlayRef.current.style.width = "100%";
      overlayRef.current.style.height = `${viewportHeight}px`;

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div ref={overlayRef} className={styles.modalOverlay} onClick={onCancel}>
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
