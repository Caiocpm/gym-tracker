// src/components/ConversationCard/ConversationCard.tsx
import React from "react";
import type { Conversation } from "../../types/professional";
import styles from "./ConversationCard.module.css";

interface ConversationCardProps {
  conversation: Conversation;
  studentName: string;
  onClick: () => void;
  currentUserType: "professional" | "student";
}

export function ConversationCard({
  conversation,
  studentName,
  onClick,
  currentUserType,
}: ConversationCardProps) {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const unreadCount =
    currentUserType === "professional"
      ? conversation.unreadCount.professional
      : conversation.unreadCount.student;

  const categoryColors: Record<string, string> = {
    general: "#3b82f6",
    training: "#10b981",
    nutrition: "#f59e0b",
    evaluation: "#8b5cf6",
    other: "#6b7280",
  };

  const categoryColor = categoryColors[conversation.category] || "#6b7280";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString("pt-BR", { weekday: "short" });
    } else {
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
    }
  };

  const truncateMessage = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div
      className={`${styles.conversationCard} ${
        unreadCount > 0 ? styles.unread : ""
      } ${conversation.isArchived ? styles.archived : ""}`}
      onClick={onClick}
    >
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{conversation.title}</h3>
          {conversation.isArchived && (
            <span className={styles.archivedBadge}>📦 Arquivada</span>
          )}
        </div>
        <span
          className={styles.categoryBadge}
          style={{ backgroundColor: categoryColor }}
        >
          {conversation.category === "general" && "Geral"}
          {conversation.category === "training" && "Treino"}
          {conversation.category === "nutrition" && "Nutrição"}
          {conversation.category === "evaluation" && "Avaliação"}
          {conversation.category === "other" && "Outro"}
        </span>
      </div>

      <div className={styles.studentName}>
        <span className={styles.studentIcon}>👤</span>
        {studentName}
      </div>

      {lastMessage && (
        <div className={styles.lastMessage}>
          <span className={styles.messagePreview}>
            <strong>
              {lastMessage.senderType === "professional" ? "Você: " : `${lastMessage.senderName}: `}
            </strong>
            {truncateMessage(lastMessage.content)}
          </span>
          <span className={styles.timestamp}>
            {formatDate(conversation.lastMessageAt)}
          </span>
        </div>
      )}

      {unreadCount > 0 && (
        <div className={styles.unreadBadge}>{unreadCount}</div>
      )}
    </div>
  );
}
