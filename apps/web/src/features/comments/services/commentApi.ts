import { apiFetch } from "@/lib/apiClient";
import type { BaseComment } from "@/lib/types";

export type CommentItem = BaseComment;

export function fetchComments(postId: string) {
  return apiFetch<CommentItem[]>(`/posts/${postId}/comments`);
}

export function createComment(postId: string, payload: { content: string }) {
  return apiFetch<CommentItem>(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
    errorToast: false,
  });
}
