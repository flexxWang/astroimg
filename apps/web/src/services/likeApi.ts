import { apiFetch } from "@/services/api";

export function toggleLike(postId: string) {
  return apiFetch<{ success: boolean; data: { liked: boolean; likeCount: number } }>(
    "/likes/toggle",
    {
      method: "POST",
      body: JSON.stringify({ postId }),
    },
  );
}

export function fetchLikeStatus(postId: string) {
  return apiFetch<{ success: boolean; data: { liked: boolean } }>(
    `/likes/status?postId=${postId}`,
    {},
  );
}
