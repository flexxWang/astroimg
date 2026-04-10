import { apiFetch } from "@/services/api";

export function toggleFollow(userId: string) {
  return apiFetch<{ following: boolean }>("/follows/toggle", {
    method: "POST",
    body: JSON.stringify({ userId }),
    errorToast: {
      title: "关注失败",
      fallback: "关注失败，请稍后再试。",
    },
  });
}

export function fetchFollowStatus(userId: string) {
  return apiFetch<{ following: boolean }>(`/follows/status?userId=${userId}`, {
    errorToast: false,
  });
}
