// src/hooks/useFirebaseNotifications.ts
import { useState, useEffect, useCallback, useRef } from "react";
import type { Notification } from "../types/professional";
import type { Notification as SocialNotification } from "../types/social";
import { notificationService } from "../services/notificationService";

// Tipo unificado que combina ambas as notificações
type UnifiedNotification = (Notification | SocialNotification) & {
  read?: boolean;
  isRead?: boolean;
};

export function useFirebaseNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const professionalUnsubscribeRef = useRef<(() => void) | null>(null);
  const socialUnsubscribeRef = useRef<(() => void) | null>(null);

  // ✅ Carregar notificações profissionais e sociais em tempo real
  useEffect(() => {
    if (!userId) return;

    try {
      // Listener para notificações profissionais (studentId)
      professionalUnsubscribeRef.current =
        notificationService.onStudentNotifications(
          userId,
          (professionalNotifs) => {
            setNotifications((prev) => {
              // Filtrar apenas notificações sociais anteriores
              const socialNotifs = prev.filter(
                (n) => "isRead" in n || "postId" in n || "groupId" in n
              );
              // Combinar com novas notificações profissionais
              const combined = [...professionalNotifs, ...socialNotifs];
              // Ordenar por data
              combined.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              );
              return combined;
            });
          }
        );

      // Listener para notificações sociais/grupos (userId)
      socialUnsubscribeRef.current = notificationService.onGroupNotifications(
        userId,
        (socialNotifs) => {
          setNotifications((prev) => {
            // Filtrar apenas notificações profissionais anteriores
            const professionalNotifs = prev.filter(
              (n) => "read" in n && !("isRead" in n)
            );
            // Combinar com novas notificações sociais
            const combined = [...professionalNotifs, ...socialNotifs];
            // Ordenar por data
            combined.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
            return combined;
          });
        }
      );
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
    }

    // Cleanup
    return () => {
      if (professionalUnsubscribeRef.current) {
        professionalUnsubscribeRef.current();
        professionalUnsubscribeRef.current = null;
      }
      if (socialUnsubscribeRef.current) {
        socialUnsubscribeRef.current();
        socialUnsubscribeRef.current = null;
      }
    };
  }, [userId]);

  // ✅ Calcular unreadCount baseado em ambos os tipos
  useEffect(() => {
    const unread = notifications.filter((n) => {
      // Notificações profissionais usam 'read'
      if ("read" in n && !("isRead" in n)) {
        return !n.read;
      }
      // Notificações sociais usam 'isRead'
      if ("isRead" in n) {
        return !n.isRead;
      }
      return false;
    }).length;
    setUnreadCount(unread);
  }, [notifications]);

  // ✅ Marcar como lida (funciona para ambos os tipos)
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const notification = notifications.find((n) => n.id === notificationId);
        if (!notification) return;

        // Verificar se é notificação social
        if ("isRead" in notification) {
          await notificationService.markGroupNotificationAsRead(notificationId);
        } else {
          // Notificação profissional
          await notificationService.markAsRead(notificationId);
        }
      } catch (err) {
        console.error("Erro ao marcar como lida:", err);
      }
    },
    [notifications]
  );

  // ✅ Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    try {
      // Marcar notificações profissionais
      await notificationService.markAllAsRead(userId);

      // Marcar notificações sociais
      const socialNotifs = notifications.filter((n) => "isRead" in n && !n.isRead);
      await Promise.all(
        socialNotifs.map((n) =>
          notificationService.markGroupNotificationAsRead(n.id)
        )
      );
    } catch (err) {
      console.error("Erro ao marcar todas como lidas:", err);
    }
  }, [userId, notifications]);

  // ✅ Deletar notificação
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
    } catch (err) {
      console.error("Erro ao deletar notificação:", err);
    }
  }, []);

  return {
    notifications,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
