import { apiFetch } from "@/services/api";

export interface DraftItem {
  id: string;
  title: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export function fetchDrafts(token: string) {
  return apiFetch<{ success: boolean; data: DraftItem[] }>("/drafts", { token });
}

export function fetchDraft(token: string, id: string) {
  return apiFetch<{ success: boolean; data: DraftItem }>(`/drafts/${id}`, {
    token,
  });
}

export function createDraft(
  token: string,
  payload: { title?: string; content?: string },
) {
  return apiFetch<{ success: boolean; data: DraftItem }>("/drafts", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateDraft(
  token: string,
  id: string,
  payload: { title?: string; content?: string },
) {
  return apiFetch<{ success: boolean; data: DraftItem }>(`/drafts/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}

export function publishDraft(token: string, id: string) {
  return apiFetch<{ success: boolean; data: { id: string } }>(
    `/drafts/${id}/publish`,
    {
      method: "POST",
      token,
    },
  );
}
