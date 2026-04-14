import { apiFetch } from "@/lib/apiClient";

export interface CommentItem {
  id: string;
  authorId: string;
  content: string;
  createdAt?: string;
}

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
