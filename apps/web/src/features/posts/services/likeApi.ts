import { apiFetch } from "@/lib/apiClient";

export function toggleLike(postId: string) {
  return apiFetch<{ liked: boolean; likeCount: number }>("/likes/toggle", {
    method: "POST",
    body: JSON.stringify({ postId }),
  });
}

export function fetchLikeStatus(postId: string) {
  return apiFetch<{ liked: boolean }>(`/likes/status?postId=${postId}`, {});
}
