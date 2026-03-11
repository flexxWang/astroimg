"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { fetchLikeStatus, toggleLike } from "@/services/likeApi";
import { useUserStore } from "@/stores/userStore";

export default function LikeButton({
  postId,
  initialCount = 0,
}: {
  postId: string;
  initialCount?: number;
}) {
  const router = useRouter();
  const token = useUserStore((state) => state.token);
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchLikeStatus(token, postId).then((result) => {
      setLiked(result.data.liked);
    }).catch(() => {});
  }, [postId, token]);

  const handleToggle = async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const result = await toggleLike(token, postId);
      setLiked(result.data.liked);
      setCount(result.data.likeCount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={liked ? "default" : "secondary"}
        size="sm"
        onClick={handleToggle}
        disabled={loading}
      >
        {liked ? "已点赞" : "点赞"}
      </Button>
      <span className="text-xs text-muted-foreground">{count}</span>
    </div>
  );
}
