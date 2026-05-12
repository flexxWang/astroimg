"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { fetchFollowStatus, toggleFollow } from "@/features/follows/services/followApi";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import { queryKeys } from "@/lib/queryKeys";

export default function FollowButton({ userId }: { userId: string }) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { data: followStatus } = useQuery({
    queryKey: queryKeys.follows.status(userId),
    queryFn: () => fetchFollowStatus(userId).then((result) => result.data),
    enabled: Boolean(user),
  });
  const toggleFollowMutation = useMutation({
    mutationFn: () => toggleFollow(userId).then((result) => result.data),
  });
  const following = toggleFollowMutation.data?.following ?? followStatus?.following ?? false;

  const handleToggle = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    await toggleFollowMutation.mutateAsync();
  };

  if (user && user.id === userId) {
    return null;
  }

  return (
    <Button
      type="button"
      variant={following ? "outline" : "default"}
      size="sm"
      onClick={handleToggle}
      disabled={toggleFollowMutation.isPending}
    >
      {following ? "已关注" : "关注"}
    </Button>
  );
}
