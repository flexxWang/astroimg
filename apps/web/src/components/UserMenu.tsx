"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import { useUserStore } from "@/stores/userStore";
import { fetchMe } from "@/services/userApi";

export default function UserMenu() {
  const token = useUserStore((state) => state.token);
  const logout = useUserStore((state) => state.logout);

  const { data } = useQuery({
    queryKey: ["me", token],
    queryFn: () => fetchMe(token!),
    enabled: Boolean(token),
  });

  if (!token) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="ghost" size="sm">
            登录
          </Button>
        </Link>
        <Link href="/register">
          <Button size="sm">注册</Button>
        </Link>
      </div>
    );
  }

  const username = data?.data?.username || "用户";

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <UserAvatar name={username} size="sm" />
        <span>{username}</span>
      </div>
      <Button variant="ghost" size="sm" onClick={logout}>
        退出
      </Button>
    </div>
  );
}
