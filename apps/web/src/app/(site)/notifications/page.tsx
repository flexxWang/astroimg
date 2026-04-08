import NotificationList from "@/components/NotificationList";
import { serverFetch } from "@/lib/serverApi";
import type { NotificationItem } from "@/services/notificationApi";
import { redirect } from "next/navigation";

export default async function NotificationsPage() {
  try {
    const result = await serverFetch<NotificationItem[]>("/notifications");
    return <NotificationList items={result.data ?? []} />;
  } catch (err) {
    redirect("/login");
  }
}
