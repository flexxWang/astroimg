"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchWorkLikeStatus, toggleWorkLike } from "@/services/workLikeApi";
import { useUserStore } from "@/stores/userStore";
import { showApiErrorToast } from "@/lib/showApiErrorToast";
import { showErrorToast } from "@/lib/showToastMessage";

export default function WorkLikeButton({
  workId,
  initialCount = 0,
}: {
  workId: string;
  initialCount?: number;
}) {
  const user = useUserStore((state) => state.user);
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
      showErrorToast("请先登录", "登录后才能点赞作品。");
      return;
    }
    try {
      const result = await toggleWorkLike(workId);
      setLiked(result.data.liked);
      setCount(result.data.likeCount);
    } catch (err) {
      showApiErrorToast(err, {
        title: "操作失败",
        fallback: "操作失败，请稍后再试。",
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
