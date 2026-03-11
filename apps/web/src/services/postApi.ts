import { apiFetch } from "@/services/api";

export interface AuthorInfo {
  id: string;
  username: string;
  avatarUrl?: string;
}

export interface PostListItem {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author?: AuthorInfo;
  createdAt?: string;
  likeCount?: number;
  commentCount?: number;
}

export function fetchPosts() {
  return apiFetch<{ success: boolean; data: PostListItem[] }>("/posts");
}

export function fetchPost(id: string) {
  return apiFetch<{ success: boolean; data: PostListItem }>(`/posts/${id}`);
}

export function fetchPostsByUser(userId: string) {
  return apiFetch<{ success: boolean; data: PostListItem[] }>(
    `/posts/user/${userId}`,
  );
}

export function createPost(
  token: string,
  payload: { title: string; content: string },
) {
  return apiFetch<{ success: boolean; data: PostListItem }>("/posts", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}
