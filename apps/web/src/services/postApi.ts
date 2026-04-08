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
  return apiFetch<Paginated<PostListItem>>("/posts");
}

export function fetchPostsPage(page = 1, pageSize = 20, keyword?: string) {
  const keywordParam = keyword ? `&keyword=${encodeURIComponent(keyword)}` : "";
  return apiFetch<Paginated<PostListItem>>(
    `/posts?page=${page}&pageSize=${pageSize}${keywordParam}`,
  );
}

export function fetchPost(id: string) {
  return apiFetch<PostListItem>(`/posts/${id}`);
}

export function fetchPostsByUser(userId: string) {
  return apiFetch<Paginated<PostListItem>>(`/posts/user/${userId}`);
}

export function fetchPostsByUserPage(userId: string, page = 1, pageSize = 20) {
  return apiFetch<Paginated<PostListItem>>(
    `/posts/user/${userId}?page=${page}&pageSize=${pageSize}`,
  );
}

export function createPost(payload: { title: string; content: string }) {
  return apiFetch<PostListItem>("/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
