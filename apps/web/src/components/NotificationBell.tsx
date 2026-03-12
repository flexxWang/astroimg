"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { fetchUnreadCount } from "@/services/notificationApi";
import { useUserStore } from "@/stores/userStore";

export default function NotificationBell() {
  const user = useUserStore((state) => state.user);
  const hydrated = useUserStore((state) => state.hydrated);

  const { data } = useQuery({
    queryKey: ["notifications", "unread", user?.id],
    queryFn: () => fetchUnreadCount(),
    enabled: Boolean(user),
    refetchInterval: 30_000,
  });

  if (!hydrated || !user) return null;

  const count = data?.data ?? 0;

  return (
    <Link href="/notifications" className="relative flex items-center">
      <Bell className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
