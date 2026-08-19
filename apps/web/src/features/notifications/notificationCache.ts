import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { NotificationItem } from "@/features/notifications/services/notificationApi";
import type { ApiResponse } from "@/lib/apiResponse";

function clampUnreadCount(count: number) {
  return count < 0 ? 0 : count;
}

export function markNotificationAsReadInCache(
  queryClient: QueryClient,
  userId: string | null | undefined,
  notificationId: string,
) {
  let decremented = false;

  queryClient.setQueryData<NotificationItem[]>(
    queryKeys.notifications.list(),
    (current = []) =>
      current.map((item) => {
        if (item.id !== notificationId) {
          return item;
        }

        if (!item.read) {
          decremented = true;
        }

        return { ...item, read: true };
      }),
  );

  if (!decremented) {
    return;
  }

  queryClient.setQueryData<ApiResponse<number> | undefined>(
    queryKeys.notifications.unread(userId),
    (current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        data: clampUnreadCount(current.data - 1),
      };
    },
  );
}

export function markAllNotificationsAsReadInCache(
  queryClient: QueryClient,
  userId: string | null | undefined,
) {
  queryClient.setQueryData<NotificationItem[]>(
    queryKeys.notifications.list(),
    (current = []) => current.map((item) => ({ ...item, read: true })),
  );
  queryClient.setQueryData<ApiResponse<number> | undefined>(
    queryKeys.notifications.unread(userId),
    (current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        data: 0,
      };
    },
  );
}
