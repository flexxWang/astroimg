import { apiFetch } from "@/lib/apiClient";

export function toggleWorkLike(workId: string) {
  return apiFetch<{ liked: boolean; likeCount: number }>(
    `/works/${workId}/likes/toggle`,
    {
      method: "POST",
      errorToast: {
        title: "操作失败",
        fallback: "操作失败，请稍后再试。",
      },
    },
  );
}

export function fetchWorkLikeStatus(workId: string) {
  return apiFetch<{ liked: boolean }>(`/works/${workId}/likes/me`, {
    errorToast: false,
  });
}
