import { apiFetch } from "@/services/api";
import type { Paginated } from "@/lib/types";

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
  return apiFetch<{ success: boolean; data: Paginated<PostListItem> }>("/posts");
}

export function fetchPostsPage(page = 1, pageSize = 20) {
  return apiFetch<{ success: boolean; data: Paginated<PostListItem> }>(
    `/posts?page=${page}&pageSize=${pageSize}`,
  );
}

export function fetchPost(id: string) {
  return apiFetch<{ success: boolean; data: PostListItem }>(`/posts/${id}`);
}

export function fetchPostsByUser(userId: string) {
  return apiFetch<{ success: boolean; data: Paginated<PostListItem> }>(
    `/posts/user/${userId}`,
  );
}

export function createPost(payload: { title: string; content: string }) {
  return apiFetch<{ success: boolean; data: PostListItem }>("/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
