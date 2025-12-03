// src/components/Groups/LikesModal/LikesModal.tsx
import { useEffect } from "react";
import { Portal } from "../../UI/Portal/Portal";
import type { PostLike } from "../../../types/social";
import styles from "./LikesModal.module.css";

interface LikesModalProps {
  isOpen: boolean;
  likes: PostLike[];
  onClose: () => void;
}

export function LikesModal({ isOpen, likes, onClose }: LikesModalProps) {
  // ✅ Log para debug
  useEffect(() => {
    if (isOpen) {
      console.log("🎯 Modal de likes aberto com dados:", likes);
      console.log("📊 Número de likes:", likes.length);
    }
  }, [isOpen, likes]);

  // ✅ Bloquear scroll do body quando modal abrir
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // ✅ Handler para ESC key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        console.log("🔑 ESC pressionado - fechando modal");
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      console.log("❌ Clique no overlay - fechando modal");
      onClose();
    }
  };

  return (
    <Portal>
      <div
        className={styles.modalOverlay}
        onClick={handleOverlayClick}
        role="presentation"
      >
        <div
          className={styles.modalContent}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className={styles.modalHeader}>
            <h2 id="modal-title" className={styles.title}>
              ❤️ Curtidas ({likes.length})
            </h2>
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Fechar modal de curtidas"
              type="button"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className={styles.modalBody}>
            {likes && likes.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Nenhuma curtida ainda</p>
              </div>
            ) : likes && likes.length > 0 ? (
              <div className={styles.likesList}>
                {likes.map((like, idx) => {
                  console.log(`🎯 Renderizando like ${idx}:`, like);

                  return (
                    <div
                      key={`${like.userId}-${idx}`}
                      className={styles.likeItem}
                    >
                      <div className={styles.avatarContainer}>
                        {like.userAvatar ? (
                          <img
                            src={like.userAvatar}
                            alt={like.userName}
                            className={styles.avatar}
                            onError={(e) => {
                              console.warn(
                                "⚠️ Erro ao carregar avatar para:",
                                like.userName
                              );
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                            onLoad={() => {
                              console.log(
                                "✅ Avatar carregado para:",
                                like.userName
                              );
                            }}
                          />
                        ) : (
                          <div className={styles.avatarInitial}>
                            {like.userName?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                      </div>
                      <div className={styles.userInfo}>
                        <div className={styles.userName}>
                          {like.userName || "Usuário Desconhecido"}
                        </div>
                        <div className={styles.likeDate}>
                          {new Date(like.createdAt).toLocaleDateString(
                            "pt-BR",
                            {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </div>
                      <div className={styles.heart}>❤️</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.loadingState}>
                <p>Carregando curtidas...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}
