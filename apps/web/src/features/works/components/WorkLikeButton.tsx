"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { fetchWorkLikeStatus, toggleWorkLike } from "@/features/works/services/workLikeApi";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import { queryKeys } from "@/lib/queryKeys";
import { showErrorToast } from "@/lib/showToastMessage";

export default function WorkLikeButton({
  workId,
  initialCount = 0,
}: {
  workId: string;
  initialCount?: number;
}) {
  const { user } = useCurrentUser();
  const { data: likeStatus } = useQuery({
    queryKey: queryKeys.works.likeStatus(workId),
    queryFn: () => fetchWorkLikeStatus(workId).then((res) => res.data),
    enabled: Boolean(user),
  });
  const toggleLikeMutation = useMutation({
    mutationFn: () => toggleWorkLike(workId).then((result) => result.data),
  });
  const liked = likeStatus?.liked ?? false;
  const count = toggleLikeMutation.data?.likeCount ?? initialCount;

  const handleToggle = async () => {
    if (!user) {
      showErrorToast("请先登录", "登录后才能点赞作品。");
      return;
    }
    await toggleLikeMutation.mutateAsync();
  };

  return (
    <Button
      type="button"
      variant={liked ? "default" : "secondary"}
      size="sm"
      onClick={handleToggle}
      disabled={toggleLikeMutation.isPending}
    >
      {liked ? "已点赞" : "点赞"} {count}
    </Button>
  );
}
