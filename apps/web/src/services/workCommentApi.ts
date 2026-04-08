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
  });
}
