import { apiFetch } from "@/services/api";

export function toggleFollow(token: string, userId: string) {
  return apiFetch<{ success: boolean; data: { following: boolean } }>(
    "/follows/toggle",
    {
      method: "POST",
      token,
      body: JSON.stringify({ userId }),
    },
  );
}

export function fetchFollowStatus(token: string, userId: string) {
  return apiFetch<{ success: boolean; data: { following: boolean } }>(
    `/follows/status?userId=${userId}`,
    { token },
  );
}
