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
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { Notification } from "../types/professional";

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
      await updateDoc(notificationRef, {
        deleted: true,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro ao deletar notificação:", error);
      throw error;
    }
  },
};
