import { apiFetch } from "@/services/api";

export interface DraftItem {
  id: string;
  title: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export function fetchDrafts() {
  return apiFetch<DraftItem[]>("/drafts", {});
}

export function fetchDraft(id: string) {
  return apiFetch<DraftItem>(`/drafts/${id}`, {});
}

export function createDraft(payload: { title?: string; content?: string }) {
  return apiFetch<DraftItem>("/drafts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDraft(
  id: string,
  payload: { title?: string; content?: string },
) {
  return apiFetch<DraftItem>(`/drafts/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function publishDraft(id: string) {
  return apiFetch<{ id: string }>(`/drafts/${id}/publish`, {
    method: "POST",
  });
}
