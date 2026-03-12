import { apiFetch } from "@/services/api";

export function toggleWorkLike(workId: string) {
  return apiFetch<{ success: boolean; data: { liked: boolean; likeCount: number } }>(
    `/works/${workId}/likes/toggle`,
    { method: "POST" },
  );
}

export function fetchWorkLikeStatus(workId: string) {
  return apiFetch<{ success: boolean; data: { liked: boolean } }>(
    `/works/${workId}/likes/me`,
  );
}
