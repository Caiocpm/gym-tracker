// src/types/UnifiedNotification.ts
// src/types/UnifiedNotification.ts
import type { Notification as ProfNotification } from "./professional";
import type { Notification as SocialNotif } from "./social";

// Tipo que aceita ambas as estruturas
export type UnifiedNotification = ProfNotification | SocialNotif;
export type NotificationType =
  | "note_created"
  | "goal_created"
  | "evaluation_scheduled"
  | "post_created"
  | "comment_added"
  | "post_liked"
  | "like";

export interface BaseNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  updatedAt?: string;
  actionUrl?: string;
}

export interface ProfessionalNotification extends BaseNotification {
  read: boolean;
  studentId?: string;
  professionalId?: string;
}

export interface SocialNotification extends BaseNotification {
  isRead?: boolean;
  read?: boolean;
  postId?: string;
  groupId?: string;
}
