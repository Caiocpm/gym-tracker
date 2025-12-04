// src/services/notificationService.ts
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  QuerySnapshot,
  type DocumentData,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { Notification } from "../types/professional";
import type { Notification as SocialNotification } from "../types/social";

export const notificationService = {
  // ✅ Criar notificação
  async createNotification(
    studentId: string,
    type: Notification["type"],
    title: string,
    message: string,
    professionalId?: string,
    actionUrl?: string
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "notifications"), {
        studentId,
        professionalId,
        type,
        title,
        message,
        actionUrl,
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Erro ao criar notificação:", error);
      throw error;
    }
  },

  // ✅ Carregar notificações em tempo real
  onStudentNotifications(
    studentId: string,
    callback: (notifications: Notification[]) => void
  ) {
    try {
      const q = query(
        collection(db, "notifications"),
        where("studentId", "==", studentId)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const notifications: Notification[] = [];
          snapshot.forEach((doc) => {
            notifications.push({
              id: doc.id,
              ...doc.data(),
            } as Notification);
          });

          // Ordenar por mais recentes primeiro
          notifications.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          callback(notifications);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
      throw error;
    }
  },

  // ✅ Marcar como lida
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      throw error;
    }
  },

  // ✅ Marcar todas como lidas
  async markAllAsRead(studentId: string): Promise<void> {
    try {
      const q = query(
        collection(db, "notifications"),
        where("studentId", "==", studentId),
        where("read", "==", false)
      );

      const unsubscribe = onSnapshot(
        q,
        async (snapshot: QuerySnapshot<DocumentData>) => {
          for (const docSnapshot of snapshot.docs) {
            const notificationRef = doc(db, "notifications", docSnapshot.id);
            await updateDoc(notificationRef, {
              read: true,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      );

      // Limpar subscription imediatamente
      setTimeout(() => unsubscribe(), 100);
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
      throw error;
    }
  },

  // ✅ Deletar notificação
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error("Erro ao deletar notificação:", error);
      throw error;
    }
  },

  // ============================================================================
  //                        NOTIFICAÇÕES DE GRUPOS
  // ============================================================================

  // ✅ Criar notificação de grupo (novo post)
  async createGroupPostNotification(
    groupId: string,
    postId: string,
    fromUserId: string,
    fromUserName: string,
    groupName: string,
    groupMemberIds: string[]
  ): Promise<void> {
    try {
      const notificationsPromises = groupMemberIds
        .filter((memberId) => memberId !== fromUserId) // Não notificar o autor
        .map((memberId) =>
          addDoc(collection(db, "notifications"), {
            userId: memberId,
            type: "new_post_in_group",
            fromUserId,
            postId,
            groupId,
            title: `📸 Novo post em ${groupName}`,
            message: `${fromUserName} compartilhou um treino no grupo`,
            isRead: false,
            createdAt: new Date().toISOString(),
          } as Omit<SocialNotification, "id">)
        );

      await Promise.all(notificationsPromises);
    } catch (error) {
      console.error("Erro ao criar notificações de novo post:", error);
      throw error;
    }
  },

  // ✅ Criar notificação de like no post
  async createPostLikeNotification(
    postId: string,
    postAuthorId: string,
    fromUserId: string,
    fromUserName: string,
    groupId?: string
  ): Promise<void> {
    try {
      // Não notificar se o autor curtiu o próprio post
      if (postAuthorId === fromUserId) return;

      await addDoc(collection(db, "notifications"), {
        userId: postAuthorId,
        type: "like",
        fromUserId,
        postId,
        groupId,
        title: "❤️ Novo like no seu post",
        message: `${fromUserName} curtiu seu treino`,
        isRead: false,
        createdAt: new Date().toISOString(),
      } as Omit<SocialNotification, "id">);
    } catch (error) {
      console.error("Erro ao criar notificação de like:", error);
      throw error;
    }
  },

  // ✅ Criar notificação de comentário no post
  async createPostCommentNotification(
    postId: string,
    commentId: string,
    postAuthorId: string,
    fromUserId: string,
    fromUserName: string,
    commentText: string,
    groupId?: string
  ): Promise<void> {
    try {
      // Não notificar se o autor comentou no próprio post
      if (postAuthorId === fromUserId) return;

      await addDoc(collection(db, "notifications"), {
        userId: postAuthorId,
        type: "comment",
        fromUserId,
        postId,
        commentId,
        groupId,
        title: "💬 Novo comentário no seu post",
        message: `${fromUserName}: ${commentText.slice(0, 50)}${
          commentText.length > 50 ? "..." : ""
        }`,
        isRead: false,
        createdAt: new Date().toISOString(),
      } as Omit<SocialNotification, "id">);
    } catch (error) {
      console.error("Erro ao criar notificação de comentário:", error);
      throw error;
    }
  },

  // ✅ Carregar notificações de grupos em tempo real
  onGroupNotifications(
    userId: string,
    callback: (notifications: SocialNotification[]) => void
  ) {
    try {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", userId)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const notifications: SocialNotification[] = [];
          snapshot.forEach((doc) => {
            notifications.push({
              id: doc.id,
              ...doc.data(),
            } as SocialNotification);
          });

          // Ordenar por mais recentes primeiro
          notifications.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          callback(notifications);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error("Erro ao carregar notificações de grupos:", error);
      throw error;
    }
  },

  // ✅ Marcar notificação de grupo como lida
  async markGroupNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
      });
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      throw error;
    }
  },
};
