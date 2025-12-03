// src/hooks/useFirebaseNotifications.ts
import { useState, useEffect, useCallback, useRef } from "react";
import type { Notification } from "../types/professional";
import { notificationService } from "../services/notificationService";

export function useFirebaseNotifications(studentId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // ✅ Carregar notificações em tempo real
  useEffect(() => {
    if (!studentId) return;

    try {
      unsubscribeRef.current = notificationService.onStudentNotifications(
        studentId,
        (loadedNotifications) => {
          // ✅ setState APENAS dentro do callback (assíncrono)
          setNotifications(loadedNotifications);
          const unread = loadedNotifications.filter((n) => !n.read).length;
          setUnreadCount(unread);
          setError(null);
        }
      );
    } catch (err) {
      // ⚠️ Erro na subscription - não podemos fazer setState aqui
      console.error("Erro ao carregar notificações:", err);
    }

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [studentId]);

  // ✅ Marcar como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
    } catch (err) {
      console.error("Erro ao marcar como lida:", err);
    }
  }, []);

  // ✅ Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!studentId) return;
    try {
      await notificationService.markAllAsRead(studentId);
    } catch (err) {
      console.error("Erro ao marcar todas como lidas:", err);
    }
  }, [studentId]);

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
