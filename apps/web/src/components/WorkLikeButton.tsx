"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { fetchWorkLikeStatus, toggleWorkLike } from "@/services/workLikeApi";
import { useUserStore } from "@/stores/userStore";

export default function WorkLikeButton({
  workId,
  initialCount = 0,
}: {
  workId: string;
  initialCount?: number;
}) {
  const user = useUserStore((state) => state.user);
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    if (!user) return;
    fetchWorkLikeStatus(workId)
      .then((res) => setLiked(res.data.liked))
      .catch(() => {});
  }, [user, workId]);

  const handleToggle = async () => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "登录后才能点赞作品。",
        variant: "destructive",
      });
      return;
    }
    try {
      const result = await toggleWorkLike(workId);
      setLiked(result.data.liked);
      setCount(result.data.likeCount);
    } catch (err) {
      toast({
        title: "操作失败",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      type="button"
      variant={liked ? "default" : "secondary"}
      size="sm"
      onClick={handleToggle}
    >
      {liked ? "已点赞" : "点赞"} {count}
    </Button>
  );
}
