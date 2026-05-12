"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { fetchLikeStatus, toggleLike } from "@/features/posts/services/likeApi";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/queryKeys";

export default function LikeButton({
  postId,
  initialCount = 0,
}: {
  postId: string;
  initialCount?: number;
}) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { data: likeStatus } = useQuery({
    queryKey: queryKeys.posts.likeStatus(postId),
    queryFn: () => fetchLikeStatus(postId).then((result) => result.data),
    enabled: Boolean(user),
  });
  const toggleLikeMutation = useMutation({
    mutationFn: () => toggleLike(postId).then((result) => result.data),
  });
  const liked = likeStatus?.liked ?? false;
  const count = toggleLikeMutation.data?.likeCount ?? initialCount;

  const handleToggle = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    await toggleLikeMutation.mutateAsync();
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={liked ? "default" : "secondary"}
        size="sm"
        onClick={handleToggle}
        disabled={toggleLikeMutation.isPending}
      >
        {liked ? "已点赞" : "点赞"}
      </Button>
      <span className="text-xs text-muted-foreground">{count}</span>
    </div>
  );
}
