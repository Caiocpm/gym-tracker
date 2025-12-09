// src/components/ChatConversation/ChatConversation.tsx
import { useState, useRef, useEffect } from "react";
import type { Conversation, ConversationMessage, StudentLink } from "../../types/professional";
import { NOTE_CATEGORY_LABELS } from "../../types/professional";
import styles from "./ChatConversation.module.css";

interface ChatConversationProps {
  conversation: Conversation;
  student: StudentLink;
  currentUserId: string;
  currentUserType: "professional" | "student";
  currentUserName: string;
  onSendMessage: (conversationId: string, content: string) => Promise<void>;
  onMarkAsRead: (conversationId: string) => Promise<void>;
  onArchive: (conversationId: string) => Promise<void>;
  onDelete: (conversationId: string) => Promise<void>;
  onClose?: () => void;
}

export function ChatConversation({
  conversation,
  student,
  currentUserId,
  currentUserType,
  currentUserName,
  onSendMessage,
  onMarkAsRead,
  onArchive,
  onDelete,
  onClose,
}: ChatConversationProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  // Marcar como lida quando abrir
  useEffect(() => {
    const unreadCount =
      currentUserType === "professional"
        ? conversation.unreadCount.professional
        : conversation.unreadCount.student;

    if (unreadCount > 0) {
      onMarkAsRead(conversation.id);
    }
  }, [conversation.id, currentUserType]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(conversation.id, newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInDays < 1) {
      // Hoje - mostrar hora
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInDays < 7) {
      // Menos de 7 dias - mostrar dia da semana
      return date.toLocaleDateString("pt-BR", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      // Mais de 7 dias - mostrar data
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const getCategoryColor = (category: typeof conversation.category) => {
    const colors: Record<string, string> = {
      progress: "#45B7D1",
      health: "#FF6B6B",
      behavior: "#FFA07A",
      evaluation: "#F7DC6F",
      other: "#98D8C8",
    };
    return colors[category] || "#45B7D1";
  };

  return (
    <div className={styles.chatConversation}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <div className={styles.headerTop}>
            <h3 className={styles.title}>{conversation.title}</h3>
            <span
              className={styles.categoryBadge}
              style={{ backgroundColor: getCategoryColor(conversation.category) }}
            >
              {NOTE_CATEGORY_LABELS[conversation.category]}
            </span>
          </div>
          <p className={styles.studentName}>
            💬 Conversa com {student.studentName || student.studentEmail}
          </p>
        </div>

        <div className={styles.headerActions}>
          {conversation.isArchived && (
            <span className={styles.archivedBadge}>📦 Arquivada</span>
          )}
          <button
            className={styles.headerBtn}
            onClick={() => onArchive(conversation.id)}
            title={conversation.isArchived ? "Desarquivar" : "Arquivar"}
          >
            {conversation.isArchived ? "📤" : "📥"}
          </button>
          <button
            className={styles.headerBtn}
            onClick={() => {
              if (confirm("Tem certeza que deseja deletar esta conversa?")) {
                onDelete(conversation.id);
              }
            }}
            title="Deletar conversa"
          >
            🗑️
          </button>
          {onClose && (
            <button
              className={styles.closeBtn}
              onClick={onClose}
              title="Fechar"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messagesContainer}>
        {conversation.messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Nenhuma mensagem ainda</p>
            <small>Envie a primeira mensagem para iniciar a conversa</small>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {conversation.messages.map((message) => {
              const isOwnMessage = message.senderId === currentUserId;

              return (
                <div
                  key={message.id}
                  className={`${styles.messageWrapper} ${
                    isOwnMessage ? styles.own : styles.other
                  }`}
                >
                  <div className={styles.message}>
                    <div className={styles.messageSender}>
                      <span className={styles.senderIcon}>
                        {message.senderType === "professional" ? "👨‍⚕️" : "👤"}
                      </span>
                      <span className={styles.senderName}>
                        {message.senderName}
                      </span>
                      {message.senderType === "professional" && (
                        <span className={styles.professionalBadge}>
                          Profissional
                        </span>
                      )}
                    </div>

                    <div className={styles.messageContent}>
                      {message.content}
                    </div>

                    <div className={styles.messageFooter}>
                      <span className={styles.messageTime}>
                        {formatDate(message.createdAt)}
                      </span>
                      {message.isRead && (
                        <span className={styles.readIndicator} title="Lida">
                          ✓✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      {!conversation.isArchived && (
        <form onSubmit={handleSendMessage} className={styles.inputContainer}>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className={styles.input}
            rows={3}
            disabled={isSending}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? "Enviando..." : "Enviar 📤"}
          </button>
        </form>
      )}

      {conversation.isArchived && (
        <div className={styles.archivedMessage}>
          📦 Esta conversa está arquivada. Desarquive para enviar mensagens.
        </div>
      )}
    </div>
  );
}
