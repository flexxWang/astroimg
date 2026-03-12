import { apiFetch } from "@/services/api";

export function toggleFollow(userId: string) {
  return apiFetch<{ success: boolean; data: { following: boolean } }>(
    "/follows/toggle",
    {
      method: "POST",
      body: JSON.stringify({ userId }),
    },
  );
}

export function fetchFollowStatus(userId: string) {
  return apiFetch<{ success: boolean; data: { following: boolean } }>(
    `/follows/status?userId=${userId}`,
    {},
  );
}
