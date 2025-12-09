// src/hooks/useConversations.ts
import { useState } from "react";
import type { Conversation, ConversationMessage } from "../types/professional";
import { professionalApi } from "../services/professionalApi";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Carregar conversas
  const loadConversations = async (params?: {
    studentLinkId?: string;
    professionalId?: string;
    includeArchived?: boolean;
  }) => {
    try {
      setLoading(true);
      const conversationsData = await professionalApi.conversations.list(params);
      setConversations(conversationsData);
      setError(null);
    } catch (err) {
      console.error("❌ Erro ao carregar conversas:", err);
      setError("Erro ao carregar conversas");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Obter uma conversa específica
  const getConversation = async (conversationId: string): Promise<Conversation | null> => {
    try {
      return await professionalApi.conversations.get(conversationId);
    } catch (err) {
      console.error("❌ Erro ao obter conversa:", err);
      return null;
    }
  };

  // ✅ Criar nova conversa
  const createConversation = async (
    studentLinkId: string,
    professionalId: string,
    studentUserId: string,
    title: string,
    category: Conversation["category"],
    initialMessage: string
  ): Promise<string | null> => {
    try {
      setLoading(true);
      console.log("📝 Criando conversa via API");

      const newConversation = await professionalApi.conversations.create({
        studentLinkId,
        professionalId,
        studentUserId,
        title,
        category,
        initialMessage,
      });

      setConversations([...conversations, newConversation]);
      setError(null);
      return newConversation.id;
    } catch (err) {
      console.error("❌ Erro ao criar conversa:", err);
      setError("Erro ao criar conversa");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Adicionar mensagem a uma conversa
  const addMessage = async (
    conversationId: string,
    senderId: string,
    senderType: "professional" | "student",
    senderName: string,
    content: string
  ): Promise<ConversationMessage | null> => {
    try {
      const newMessage = await professionalApi.conversations.addMessage(
        conversationId,
        {
          senderId,
          senderType,
          senderName,
          content,
        }
      );

      // Atualizar conversa local
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: [...conv.messages, newMessage],
                lastMessageAt: newMessage.createdAt,
                unreadCount:
                  senderType === "professional"
                    ? { ...conv.unreadCount, student: conv.unreadCount.student + 1 }
                    : { ...conv.unreadCount, professional: conv.unreadCount.professional + 1 },
              }
            : conv
        )
      );

      return newMessage;
    } catch (err) {
      console.error("❌ Erro ao adicionar mensagem:", err);
      setError("Erro ao enviar mensagem");
      return null;
    }
  };

  // ✅ Marcar mensagens como lidas
  const markAsRead = async (
    conversationId: string,
    userId: string,
    userType: "professional" | "student"
  ): Promise<boolean> => {
    try {
      await professionalApi.conversations.markAsRead(conversationId, userId, userType);

      // Atualizar conversa local
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: conv.messages.map((msg) =>
                  msg.senderId !== userId && !msg.isRead
                    ? { ...msg, isRead: true, readAt: new Date().toISOString() }
                    : msg
                ),
                unreadCount:
                  userType === "professional"
                    ? { ...conv.unreadCount, professional: 0 }
                    : { ...conv.unreadCount, student: 0 },
              }
            : conv
        )
      );

      return true;
    } catch (err) {
      console.error("❌ Erro ao marcar como lida:", err);
      return false;
    }
  };

  // ✅ Arquivar conversa
  const archiveConversation = async (conversationId: string): Promise<boolean> => {
    try {
      await professionalApi.conversations.archive(conversationId);

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, isArchived: true } : conv
        )
      );

      return true;
    } catch (err) {
      console.error("❌ Erro ao arquivar conversa:", err);
      return false;
    }
  };

  // ✅ Desarquivar conversa
  const unarchiveConversation = async (conversationId: string): Promise<boolean> => {
    try {
      await professionalApi.conversations.unarchive(conversationId);

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, isArchived: false } : conv
        )
      );

      return true;
    } catch (err) {
      console.error("❌ Erro ao desarquivar conversa:", err);
      return false;
    }
  };

  // ✅ Deletar conversa
  const deleteConversation = async (conversationId: string): Promise<boolean> => {
    try {
      await professionalApi.conversations.delete(conversationId);
      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
      return true;
    } catch (err) {
      console.error("❌ Erro ao deletar conversa:", err);
      return false;
    }
  };

  return {
    conversations,
    loading,
    error,
    loadConversations,
    getConversation,
    createConversation,
    addMessage,
    markAsRead,
    archiveConversation,
    unarchiveConversation,
    deleteConversation,
  };
}
