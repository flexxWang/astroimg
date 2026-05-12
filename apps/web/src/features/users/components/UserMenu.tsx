"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import { queryKeys } from "@/lib/queryKeys";
import UserAvatar from "@/shared/components/UserAvatar";
import { logout } from "@/features/users/services/authApi";

export default function UserMenu() {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

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
    queryClient.removeQueries({ queryKey: queryKeys.auth.me() });
  };

  return (
    <div className="group relative">
      <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <UserAvatar name={username} size="sm" />
        <span>{username}</span>
      </button>
      <div className="pointer-events-none absolute right-0 top-full w-40 pt-3 opacity-0 transition group-hover:opacity-100 group-hover:pointer-events-auto">
        <div className="rounded-xl border bg-white/95 p-2 shadow-lg">
          <Link
            href={`/user/${user.id}`}
            className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-slate-100"
          >
            我的主页
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-slate-100"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
