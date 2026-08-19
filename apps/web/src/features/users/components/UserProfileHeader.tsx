"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import FollowButton from "@/features/follows/components/FollowButton";
import { userProfileQueryOptions } from "@/features/users/queries/userProfileQuery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/lib/types";
import UserAvatar from "@/shared/components/UserAvatar";

export default function UserProfileHeader({
  initialProfile,
  userId,
}: {
  initialProfile: UserProfile;
  userId: string;
}) {
  const { data: user } = useQuery(
    userProfileQueryOptions(userId, initialProfile),
  );
  const stats = user?.stats ?? {
    posts: 0,
    followers: 0,
    following: 0,
    likes: 0,
  };
  const joinedAt = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : "未知";

  return (
    <section className="rounded-3xl border bg-white/80 p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-6">
        <UserAvatar name={user?.username || "用户"} size="lg" />
        <div className="flex-1 space-y-2">
          <Badge variant="secondary">用户主页</Badge>
          <h1 className="text-2xl font-semibold">
            {user?.username || "用户"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {user?.bio || "这个人还没有填写简介"}
          </p>
          <div className="text-xs text-muted-foreground">
            加入时间 · {joinedAt}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FollowButton userId={userId} />
          <Link href={`/messages?to=${userId}`}>
            <Button variant="secondary" size="sm">
              私信
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "发布", value: stats.posts },
          { label: "获赞", value: stats.likes },
          { label: "粉丝", value: stats.followers },
          { label: "关注", value: stats.following },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border bg-white/70 p-4 text-center"
          >
            <div className="text-xl font-semibold">{item.value}</div>
            <div className="text-xs text-muted-foreground">{item.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
