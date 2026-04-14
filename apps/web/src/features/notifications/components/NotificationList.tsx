"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  markAllRead,
  markNotificationRead,
  type NotificationItem,
} from "@/features/notifications/services/notificationApi";

export default function NotificationList({
  items,
}: {
  items: NotificationItem[];
}) {
  const router = useRouter();

  const handleRead = async (id: string) => {
    await markNotificationRead(id);
    router.refresh();
  };

  const handleReadAll = async () => {
    await markAllRead();
    router.refresh();
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
                  >
                    标记已读
                  </Button>
                ) : null}
              </div>
              {item.postId ? (
                <Link
                  href={`/post/${item.postId}`}
                  className="text-xs text-muted-foreground"
                  onClick={() => handleRead(item.id)}
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
