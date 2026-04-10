"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { fetchFollowStatus, toggleFollow } from "@/services/followApi";
import { useUserStore } from "@/stores/userStore";

export default function FollowButton({ userId }: { userId: string }) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
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
    } catch {
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
