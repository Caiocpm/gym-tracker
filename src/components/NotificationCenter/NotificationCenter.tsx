// src/components/NotificationCenter/NotificationCenter.tsx
import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { UnifiedNotification } from "../../types/UnifiedNotification";
import styles from "./NotificationCenter.module.css";

interface NotificationCenterProps {
  notifications: UnifiedNotification[];
  unreadCount: number;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (notificationId: string) => void;
  onNotificationClick?: (notification: UnifiedNotification) => void;
  onClose?: () => void; // ✅ NOVO: Callback para fechar
}

export function NotificationCenter({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onNotificationClick,
  onClose, // ✅ NOVO
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

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

  // ✅ NOVO: Fechar modal com callback
  const handleClose = useCallback(() => {
    setIsOpen(false);
    onClose?.(); // ✅ NOVO: Avisa o pai que fechou
  }, [onClose]);

  // ✅ Fechar modal ao clicar fora
  const handleBackdropClick = useCallback(() => {
    handleClose();
  }, [handleClose]);

  // ✅ Impedir propagação de cliques dentro do modal
  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // ✅ Fechar modal ao pressionar ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, handleClose]);

  // ✅ Obter ícone baseado no tipo de notificação
  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case "note_created":
        return "📝";
      case "goal_created":
        return "🎯";
      case "evaluation_scheduled":
        return "📋";
      case "post_created":
        return "📸";
      case "comment_added":
      case "comment":
        return "💬";
      case "post_liked":
      case "like":
        return "❤️";
      case "new_post_in_group":
        return "📢";
      default:
        return "🔔";
    }
  };

  // ✅ Obter cor baseada no tipo
  const getNotificationColor = (type: string): string => {
    switch (type) {
      case "note_created":
        return "#FF6B6B";
      case "goal_created":
        return "#4ECDC4";
      case "evaluation_scheduled":
        return "#45B7D1";
      case "post_created":
        return "#96CEB4";
      case "comment_added":
      case "comment":
        return "#FFEAA7";
      case "post_liked":
      case "like":
        return "#DDA0DD";
      case "new_post_in_group":
        return "#A8E6CF";
      default:
        return "#95E1D3";
    }
  };

  // ✅ Formatar data de forma legível
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Agora mesmo";
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;

    return date.toLocaleDateString("pt-BR");
  };

  // ✅ Verificar se notificação está lida (suporta ambas as estruturas)
  const isNotificationRead = (notification: UnifiedNotification): boolean => {
    if ("isRead" in notification && notification.isRead !== undefined) {
      return notification.isRead;
    }
    if ("read" in notification && notification.read !== undefined) {
      return notification.read;
    }
    return false;
  };

  // ✅ Renderizar modal no body usando Portal
  const renderModal = () => {
    if (!isOpen) {
      return null;
    }

    return (
      <div ref={overlayRef} className={styles.overlay}>
        {/* Backdrop */}
        <div className={styles.backdrop} onClick={handleBackdropClick} />

        {/* Modal */}
        <div ref={modalRef} className={styles.modal} onClick={handleModalClick}>
          {/* Header */}
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>
              🔔 Notificações {unreadCount > 0 && `(${unreadCount})`}
            </h2>
            <button
              className={styles.closeButton}
              onClick={handleClose} // ✅ MUDADO
              title="Fechar"
            >
              ✕
            </button>
          </div>

          {/* Ações rápidas */}
          {notifications.length > 0 && unreadCount > 0 && (
            <div className={styles.quickActions}>
              <button
                className={styles.markAllButton}
                onClick={() => {
                  onMarkAllAsRead();
                }}
              >
                ✓ Marcar tudo como lido
              </button>
            </div>
          )}

          {/* Lista de notificações */}
          <div className={styles.notificationsList}>
            {notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🎉</div>
                <p className={styles.emptyText}>
                  Você está em dia! Nenhuma notificação nova.
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const isUnread = !isNotificationRead(notification);
                const isClickable =
                  ("postId" in notification && notification.postId) ||
                  ("groupId" in notification && notification.groupId);

                return (
                  <div
                    key={notification.id}
                    className={`${styles.notificationItem} ${
                      isUnread ? styles.unread : ""
                    } ${isClickable ? styles.clickable : ""}`}
                    style={{
                      borderLeftColor: getNotificationColor(notification.type),
                    }}
                    onClick={() => {
                      if (isClickable && onNotificationClick) {
                        onNotificationClick(notification);
                        onMarkAsRead(notification.id);
                        handleClose(); // ✅ MUDADO
                      }
                    }}
                  >
                    {/* Conteúdo */}
                    <div className={styles.notificationContent}>
                      <div className={styles.notificationHeader}>
                        <span className={styles.notificationIcon}>
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className={styles.notificationTextContent}>
                          <h3 className={styles.notificationTitle}>
                            {notification.title}
                          </h3>
                          <p className={styles.notificationMessage}>
                            {notification.message}
                          </p>
                        </div>
                      </div>
                      <div className={styles.notificationFooter}>
                        <span className={styles.notificationDate}>
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className={styles.notificationActions}>
                      {isUnread && (
                        <button
                          className={styles.actionButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead(notification.id);
                          }}
                          title="Marcar como lida"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        className={styles.deleteButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(notification.id);
                        }}
                        title="Deletar"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.notificationCenterContainer}>
      {/* ✅ Botão de sino com badge */}
      <button
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        title="Notificações"
      >
        <span className={styles.bellIcon}>🔔</span>
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ✅ Renderizar modal no body usando Portal */}
      {createPortal(renderModal(), document.body)}
    </div>
  );
}
