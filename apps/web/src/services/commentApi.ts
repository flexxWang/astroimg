import { apiFetch } from "@/services/api";

export interface CommentItem {
  id: string;
  authorId: string;
  content: string;
  createdAt?: string;
}

export function fetchComments(postId: string) {
  return apiFetch<{ success: boolean; data: CommentItem[] }>(
    `/posts/${postId}/comments`,
  );
}

export function createComment(
  token: string,
  postId: string,
  payload: { content: string },
) {
  return apiFetch<{ success: boolean; data: CommentItem }>(
    `/posts/${postId}/comments`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    },
  );
}
