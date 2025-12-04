// src/components/WorkoutTracker/WorkoutCompletionToast/WorkoutCompletionToast.tsx
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./WorkoutCompletionToast.module.css";

interface WorkoutCompletionToastProps {
  isVisible: boolean;
  onShare: () => void;
  onDismiss: () => void;
  workoutName: string;
}

export function WorkoutCompletionToast({
  isVisible,
  onShare,
  onDismiss,
  workoutName,
}: WorkoutCompletionToastProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [position, setPosition] = useState<{ top: number; right: number | string; left: number | string }>({
    top: 20,
    right: 20,
    left: 'auto'
  });

  // Calcula a posição do toast baseado no scroll e tamanho da tela
  useEffect(() => {
    if (!isVisible || isDismissed) return;

    const updatePosition = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const windowWidth = window.innerWidth;

      // Calcula o offset do topo baseado no breakpoint
      let topOffset = 20;
      let rightOffset = 20;

      if (windowWidth <= 480) {
        topOffset = 16;
        rightOffset = 8;
      } else if (windowWidth <= 768) {
        topOffset = 20;
        rightOffset = 12;
      }

      // Sempre fixa no lado direito
      setPosition({
        top: scrollY + topOffset,
        right: rightOffset,
        left: 'auto'
      });
    };

    // Atualiza imediatamente
    updatePosition();

    // Atualiza ao rolar
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, isDismissed]);

  if (!isVisible || isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss();
  };

  return createPortal(
    <div
      className={styles.toast}
      style={{
        top: `${position.top}px`,
        right: typeof position.right === 'number' ? `${position.right}px` : position.right,
        left: typeof position.left === 'number' ? `${position.left}px` : position.left
      }}
    >
      <div className={styles.toastContent}>
        <div className={styles.toastMessage}>
          <span className={styles.icon}>🎉</span>
          <div className={styles.text}>
            <h4>{workoutName} Concluído!</h4>
            <p>Compartilhe seu treino com seus grupos</p>
          </div>
        </div>

        <div className={styles.toastActions}>
          <button
            className={styles.shareBtn}
            onClick={onShare}
            title="Compartilhar treino"
          >
            📤 Compartilhar
          </button>
          <button
            className={styles.dismissBtn}
            onClick={handleDismiss}
            title="Descartar"
          >
            ✕
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
