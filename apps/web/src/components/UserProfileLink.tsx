"use client";

import Link from "next/link";
import { useUserStore } from "@/stores/userStore";

export default function UserProfileLink() {
  const user = useUserStore((state) => state.user);
  const href = user ? `/user/${user.id}` : "/login";
  return <Link href={href}>我的主页</Link>;
}
