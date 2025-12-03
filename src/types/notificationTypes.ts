// src/contexts/notificationTypes.ts

export type NotificationType =
  | "note_created"
  | "goal_created"
  | "evaluation_scheduled"
  | "post_created"
  | "comment_added"
  | "post_liked";

export interface Notification {
  id: string;
  studentId: string;
  professionalId?: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}
