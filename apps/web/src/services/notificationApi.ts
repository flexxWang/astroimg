import { apiFetch } from "@/services/api";

export interface NotificationItem {
  id: string;
  userId: string;
  actorId: string;
  actorName: string;
  type: "like" | "comment" | "follow";
  postId?: string;
  read: boolean;
  createdAt?: string;
}

export function fetchNotifications() {
  return apiFetch<{ success: boolean; data: NotificationItem[] }>(
    "/notifications",
    {},
  );
}

export function fetchUnreadCount() {
  return apiFetch<{ success: boolean; data: number }>(
    "/notifications/unread-count",
    {},
  );
}

export function markNotificationRead(id: string) {
  return apiFetch<{ success: boolean; data: NotificationItem }>(
    "/notifications/read",
    {
      method: "POST",
      body: JSON.stringify({ id }),
    },
  );
}

export function markAllRead() {
  return apiFetch<{ success: boolean; data: { success: boolean } }>(
    "/notifications/read-all",
    {
      method: "POST",
    },
  );
}
