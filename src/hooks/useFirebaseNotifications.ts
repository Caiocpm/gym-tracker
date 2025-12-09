// src/hooks/useFirebaseNotifications.ts
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { getAuth } from "firebase/auth"; // ✅ NOVO: Para pegar UID atual
import type { Notification } from "../types/professional";
import type { Notification as SocialNotification } from "../types/social";
import { notificationService } from "../services/notificationService";

type UnifiedNotification = (Notification | SocialNotification) & {
  read?: boolean;
  isRead?: boolean;
};

export function useFirebaseNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
  const [isTestMode, setIsTestMode] = useState(false);
  const professionalUnsubscribeRef = useRef<(() => void) | null>(null);
  const socialUnsubscribeRef = useRef<(() => void) | null>(null);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => {
      if ("read" in n && !("isRead" in n)) {
        return !n.read;
      }
      if ("isRead" in n) {
        return !n.isRead;
      }
      return false;
    }).length;
  }, [notifications]);

  useEffect(() => {
    if (!userId || isTestMode) return;

    console.log("📡 Iniciando listeners do Firebase para userId:", userId);

    try {
      professionalUnsubscribeRef.current =
        notificationService.onStudentNotifications(
          userId,
          (professionalNotifs) => {
            console.log(
              "📨 Notificações profissionais recebidas:",
              professionalNotifs.length
            );
            setNotifications((prev) => {
              const socialNotifs = prev.filter(
                (n) => "isRead" in n || "postId" in n || "groupId" in n
              );
              const combined = [...professionalNotifs, ...socialNotifs];
              combined.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              );
              return combined;
            });
          }
        );

      socialUnsubscribeRef.current = notificationService.onGroupNotifications(
        userId,
        (socialNotifs) => {
          console.log(
            "📨 Notificações sociais recebidas:",
            socialNotifs.length
          );
          setNotifications((prev) => {
            const professionalNotifs = prev.filter(
              (n) => "read" in n && !("isRead" in n)
            );
            const combined = [...professionalNotifs, ...socialNotifs];
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
      console.error("❌ Erro ao carregar notificações:", err);
    }

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
  }, [userId, isTestMode]);

  // ✅ Marcar como lida
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const notification = notifications.find((n) => n.id === notificationId);
        if (!notification) {
          console.warn("⚠️ Notificação não encontrada:", notificationId);
          return;
        }

        // ✅ Atualizar UI imediatamente (otimista)
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read: true, isRead: true } : n
          )
        );

        // ✅ Se for modo teste, pula Firebase
        if (isTestMode) {
          console.log(
            "✅ [TESTE] Notificação marcada como lida (local):",
            notificationId
          );
          return;
        }

        // ✅ Tentar atualizar no Firebase
        try {
          if ("isRead" in notification) {
            await notificationService.markGroupNotificationAsRead(
              notificationId
            );
            console.log(
              "✅ Notificação social marcada como lida:",
              notificationId
            );
          } else {
            await notificationService.markAsRead(notificationId);
            console.log(
              "✅ Notificação profissional marcada como lida:",
              notificationId
            );
          }
        } catch (firebaseErr) {
          if (
            firebaseErr instanceof Error &&
            firebaseErr.message.includes("permission")
          ) {
            console.warn(
              "⚠️ Permissão insuficiente. UI atualizada localmente."
            );
          } else {
            console.error(
              "❌ Erro ao marcar notificação como lida:",
              firebaseErr
            );
          }
        }
      } catch (err) {
        console.error("❌ Erro inesperado ao marcar como lida:", err);
      }
    },
    [notifications, isTestMode]
  );

  // ✅ Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    try {
      // ✅ Atualizar UI imediatamente (otimista)
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
          isRead: true,
        }))
      );

      // ✅ Se for modo teste, pula Firebase
      if (isTestMode) {
        console.log(
          "✅ [TESTE] Todas as notificações marcadas como lidas (local)"
        );
        return;
      }

      // ✅ Tentar atualizar no Firebase
      try {
        await notificationService.markAllAsRead(userId);
        console.log(
          "✅ Todas as notificações profissionais marcadas como lidas"
        );

        const socialNotifs = notifications.filter(
          (n) => "isRead" in n && !n.isRead
        );
        await Promise.all(
          socialNotifs.map((n) =>
            notificationService.markGroupNotificationAsRead(n.id)
          )
        );
        console.log("✅ Todas as notificações sociais marcadas como lidas");
      } catch (firebaseErr) {
        if (
          firebaseErr instanceof Error &&
          firebaseErr.message.includes("permission")
        ) {
          console.warn("⚠️ Permissão insuficiente. UI atualizada localmente.");
        } else {
          console.error("❌ Erro ao marcar todas como lidas:", firebaseErr);
        }
      }
    } catch (err) {
      console.error("❌ Erro inesperado:", err);
    }
  }, [userId, notifications, isTestMode]);

  // ✅ Deletar notificação
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        // ✅ Atualizar UI imediatamente (otimista)
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

        // ✅ Se for modo teste, pula Firebase
        if (isTestMode) {
          console.log(
            "✅ [TESTE] Notificação deletada (local):",
            notificationId
          );
          return;
        }

        // ✅ Tentar deletar no Firebase
        try {
          await notificationService.deleteNotification(notificationId);
          console.log("✅ Notificação deletada:", notificationId);
        } catch (firebaseErr) {
          if (
            firebaseErr instanceof Error &&
            firebaseErr.message.includes("permission")
          ) {
            console.warn(
              "⚠️ Permissão insuficiente. Removida da UI localmente."
            );
          } else {
            console.error("❌ Erro ao deletar notificação:", firebaseErr);
          }
        }
      } catch (err) {
        console.error("❌ Erro inesperado ao deletar:", err);
      }
    },
    [isTestMode]
  );

  // ✅ CORRIGIDO: Adicionar notificações de teste com userId
  const addTestNotifications = useCallback(
    (testNotifs: UnifiedNotification[]) => {
      const currentUserId = getAuth().currentUser?.uid;
      if (!currentUserId) {
        console.error(
          "❌ Usuário não autenticado! Não é possível criar notificações de teste."
        );
        return;
      }

      setIsTestMode(true);
      setNotifications((prev) => {
        const enrichedNotifs = testNotifs.map((notif) => ({
          ...notif,
          userId: currentUserId, // ✅ ADICIONA O CAMPO OBRIGATÓRIO!
          studentId: currentUserId, // ✅ Para compatibilidade com profissional
          professionalId: currentUserId, // ✅ Para compatibilidade
        }));

        const combined = [...enrichedNotifs, ...prev];
        combined.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return combined;
      });
      console.log(
        "✅ Notificações de teste adicionadas com userId:",
        currentUserId,
        testNotifs.length
      );
    },
    []
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
    setIsTestMode(false);
    console.log("🗑️ Todas as notificações foram limpas");
  }, []);

  const resetTestMode = useCallback(() => {
    setIsTestMode(false);
    setNotifications([]);
    console.log("🔄 Modo teste desativado, voltando ao Firebase");
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addTestNotifications,
    clearAll,
    resetTestMode,
    isTestMode,
  };
}
