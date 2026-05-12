"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  fetchNotifications,
  markAllRead,
  markNotificationRead,
  type NotificationItem,
} from "@/features/notifications/services/notificationApi";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import { queryKeys } from "@/lib/queryKeys";

export default function NotificationList({
  items: initialItems,
}: {
  items: NotificationItem[];
}) {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const { data: items = [] } = useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => fetchNotifications().then((result) => result.data),
    initialData: initialItems,
    enabled: Boolean(user),
  });
  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id).then((result) => result.data),
    onSuccess: (updatedItem) => {
      queryClient.setQueryData<NotificationItem[]>(
        queryKeys.notifications.list(),
        (current = []) =>
          current.map((item) =>
            item.id === updatedItem.id ? { ...item, read: true } : item,
          ),
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unread(user?.id),
      });
    },
  });
  const markAllReadMutation = useMutation({
    mutationFn: () => markAllRead(),
    onSuccess: () => {
      queryClient.setQueryData<NotificationItem[]>(
        queryKeys.notifications.list(),
        (current = []) => current.map((item) => ({ ...item, read: true })),
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unread(user?.id),
      });
    },
  });

  const handleRead = async (id: string) => {
    await markReadMutation.mutateAsync(id);
  };

  const handleReadAll = async () => {
    await markAllReadMutation.mutateAsync();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">通知</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleReadAll}>
            全部已读
          </Button>
          <Link href="/">
            <Button variant="secondary">返回首页</Button>
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground">暂无通知</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border px-4 py-3 ${
                item.read ? "bg-white/50" : "bg-white/90"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm">
                  <span className="font-medium">
                    {item.actorName || item.actorId}
                  </span>
                  {item.type === "like" && " 点赞了你的帖子"}
                  {item.type === "comment" && " 评论了你的帖子"}
                  {item.type === "follow" && " 关注了你"}
                </div>
                {!item.read ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRead(item.id)}
                    disabled={markReadMutation.isPending}
                  >
                    标记已读
                  </Button>
                ) : null}
              </div>
              {item.postId ? (
                <Link
                  href={`/post/${item.postId}`}
                  className="text-xs text-muted-foreground"
                  onClick={() => {
                    if (!item.read) {
                      void handleRead(item.id);
                    }
                  }}
                >
                  查看详情
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
