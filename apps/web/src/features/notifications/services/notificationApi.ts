import { apiFetch } from "@/lib/apiClient";

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
  return apiFetch<NotificationItem[]>("/notifications", {});
}

export function fetchUnreadCount() {
  return apiFetch<number>("/notifications/unread-count", {});
}

export function markNotificationRead(id: string) {
  return apiFetch<NotificationItem>("/notifications/read", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export function markAllRead() {
  return apiFetch<null>("/notifications/read-all", {
    method: "POST",
  });
}
