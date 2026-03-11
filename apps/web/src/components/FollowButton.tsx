"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { fetchFollowStatus, toggleFollow } from "@/services/followApi";
import { useUserStore } from "@/stores/userStore";

export default function FollowButton({ userId }: { userId: string }) {
  const router = useRouter();
  const token = useUserStore((state) => state.token);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchFollowStatus(token, userId)
      .then((result) => setFollowing(result.data.following))
      .catch(() => {});
  }, [token, userId]);

  const handleToggle = async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const result = await toggleFollow(token, userId);
      setFollowing(result.data.following);
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
