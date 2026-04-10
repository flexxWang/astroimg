import { apiFetch } from "@/services/api";
import type { WorkComment } from "@/lib/types";

export function fetchWorkComments(workId: string) {
  return apiFetch<WorkComment[]>(`/works/${workId}/comments`);
}

export function createWorkComment(
  workId: string,
  payload: { content: string },
) {
  return apiFetch<WorkComment>(`/works/${workId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
    errorToast: {
      title: "评论失败",
      fallback: "评论失败，请稍后再试。",
    },
  });
}
