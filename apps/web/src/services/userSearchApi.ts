import { apiFetch } from "@/services/api";

export interface SearchUserItem {
  id: string;
  username: string;
  avatarUrl?: string;
}

export function searchUsers(keyword: string) {
  return apiFetch<{ success: boolean; data: SearchUserItem[] }>(
    `/users?keyword=${encodeURIComponent(keyword)}`,
    {},
  );
}
