import { apiFetch } from "@/services/api";

export interface DraftItem {
  id: string;
  title: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export function fetchDrafts() {
  return apiFetch<{ success: boolean; data: DraftItem[] }>("/drafts", {});
}

export function fetchDraft(id: string) {
  return apiFetch<{ success: boolean; data: DraftItem }>(`/drafts/${id}`, {});
}

export function createDraft(payload: { title?: string; content?: string }) {
  return apiFetch<{ success: boolean; data: DraftItem }>("/drafts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDraft(
  id: string,
  payload: { title?: string; content?: string },
) {
  return apiFetch<{ success: boolean; data: DraftItem }>(`/drafts/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function publishDraft(id: string) {
  return apiFetch<{ success: boolean; data: { id: string } }>(
    `/drafts/${id}/publish`,
    {
      method: "POST",
    },
  );
}
