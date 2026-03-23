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
