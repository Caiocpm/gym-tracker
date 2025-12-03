// src/components/NotificationCenter/NotificationCenter.tsx
import { useState, useCallback } from "react";
import type { Notification } from "../../types/professional";
import styles from "./NotificationCenter.module.css";

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (notificationId: string) => void;
}

export function NotificationCenter({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);

  // ✅ Fechar modal ao clicar fora
  const handleBackdropClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  // ✅ Impedir propagação de cliques dentro do modal
  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // ✅ Obter ícone baseado no tipo de notificação
  const getNotificationIcon = (type: string) => {
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
        return "💬";
      case "post_liked":
        return "❤️";
      default:
        return "🔔";
    }
  };

  // ✅ Obter cor baseada no tipo
  const getNotificationColor = (type: string) => {
    switch (type) {
      case "note_created":
        return "#FF6B6B"; // Vermelho
      case "goal_created":
        return "#4ECDC4"; // Teal
      case "evaluation_scheduled":
        return "#45B7D1"; // Azul
      case "post_created":
        return "#96CEB4"; // Verde
      case "comment_added":
        return "#FFEAA7"; // Amarelo
      case "post_liked":
        return "#DDA0DD"; // Plum
      default:
        return "#95E1D3";
    }
  };

  // ✅ Formatar data de forma legível
  const formatDate = (dateString: string) => {
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

      {/* ✅ Modal de notificações */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className={styles.backdrop} onClick={handleBackdropClick} />

          {/* Modal */}
          <div className={styles.modal} onClick={handleModalClick}>
            {/* Header */}
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                🔔 Notificações {unreadCount > 0 && `(${unreadCount})`}
              </h2>
              <button
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
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
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`${styles.notificationItem} ${
                      !notification.read ? styles.unread : ""
                    }`}
                    style={{
                      borderLeftColor: getNotificationColor(notification.type),
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
                      {!notification.read && (
                        <button
                          className={styles.actionButton}
                          onClick={() => onMarkAsRead(notification.id)}
                          title="Marcar como lida"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        className={styles.deleteButton}
                        onClick={() => onDelete(notification.id)}
                        title="Deletar"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
