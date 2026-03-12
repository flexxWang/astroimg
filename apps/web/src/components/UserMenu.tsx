"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import { useUserStore } from "@/stores/userStore";
import { logout } from "@/services/authApi";

export default function UserMenu() {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  if (!user) {
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

  const username = user.username || "用户";

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserAvatar name={username} size="sm" />
          <span>{username}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          退出
        </Button>
      </div>
  );
}
