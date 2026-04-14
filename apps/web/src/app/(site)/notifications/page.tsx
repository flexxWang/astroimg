import NotificationList from "@/features/notifications/components/NotificationList";
import { serverFetch } from "@/lib/serverApi";
import type { NotificationItem } from "@/features/notifications/services/notificationApi";
import { redirect } from "next/navigation";

export default async function NotificationsPage() {
  let items: NotificationItem[] = [];

  try {
    const result = await serverFetch<NotificationItem[]>("/notifications");
    items = result.data ?? [];
  } catch {
    redirect("/login");
  }

  return <NotificationList items={items} />;
}
