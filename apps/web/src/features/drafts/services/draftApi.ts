import { apiFetch } from "@/lib/apiClient";

export interface DraftItem {
  id: string;
  title: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export function fetchDrafts() {
  return apiFetch<DraftItem[]>("/drafts", {
    errorToast: {
      title: "加载草稿失败",
      fallback: "加载草稿失败，请稍后再试。",
    },
  });
}

export function fetchDraft(id: string) {
  return apiFetch<DraftItem>(`/drafts/${id}`, {
    errorToast: {
      title: "加载失败",
      fallback: "加载失败，请稍后再试。",
    },
  });
}

export function createDraft(payload: { title?: string; content?: string }) {
  return apiFetch<DraftItem>("/drafts", {
    method: "POST",
    body: JSON.stringify(payload),
    errorToast: {
      title: "保存失败",
      fallback: "保存失败，请稍后再试。",
    },
  });
}

export function updateDraft(
  id: string,
  payload: { title?: string; content?: string },
) {
  return apiFetch<DraftItem>(`/drafts/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    errorToast: {
      title: "保存失败",
      fallback: "保存失败，请稍后再试。",
    },
  });
}

export function publishDraft(id: string) {
  return apiFetch<{ id: string }>(`/drafts/${id}/publish`, {
    method: "POST",
    errorToast: {
      title: "发布失败",
      fallback: "发布失败，请稍后再试。",
    },
  });
}
