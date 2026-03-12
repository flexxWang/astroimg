"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { fetchFollowStatus, toggleFollow } from "@/services/followApi";
import { useUserStore } from "@/stores/userStore";
import { useToast } from "@/hooks/useToast";

export default function FollowButton({ userId }: { userId: string }) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { toast, hasToast } = useToast();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user && user.id === userId) {
    return null;
  }

  useEffect(() => {
    if (!user) return;
    fetchFollowStatus(userId)
      .then((result) => setFollowing(result.data.following))
      .catch(() => {});
  }, [user, userId]);

  const handleToggle = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const result = await toggleFollow(userId);
      setFollowing(result.data.following);
    } catch (err) {
      const message = (err as Error).message || "关注失败";
      if (!hasToast(message)) {
        toast({ title: "关注失败", description: message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={following ? "outline" : "default"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
    >
      {following ? "已关注" : "关注"}
    </Button>
  );
}
