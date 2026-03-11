import { apiFetch } from "@/services/api";

export function toggleLike(token: string, postId: string) {
  return apiFetch<{ success: boolean; data: { liked: boolean; likeCount: number } }>(
    "/likes/toggle",
    {
      method: "POST",
      token,
      body: JSON.stringify({ postId }),
    },
  );
}

export function fetchLikeStatus(token: string, postId: string) {
  return apiFetch<{ success: boolean; data: { liked: boolean } }>(
    `/likes/status?postId=${postId}`,
    { token },
  );
}
