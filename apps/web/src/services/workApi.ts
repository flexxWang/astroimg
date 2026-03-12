import { apiFetch } from "@/services/api";
import type { Paginated, WorkDevice, WorkItem, WorkType } from "@/lib/types";

export function fetchWorksPage(page = 1, pageSize = 20) {
  return apiFetch<{ success: boolean; data: Paginated<WorkItem> }>(
    `/works?page=${page}&pageSize=${pageSize}`,
  );
}

export function fetchWorkTypes() {
  return apiFetch<{ success: boolean; data: WorkType[] }>("/works/types");
}

export function fetchWorkDevices() {
  return apiFetch<{ success: boolean; data: WorkDevice[] }>("/works/devices");
}

export function createWork(payload: {
  title: string;
  description?: string;
  imageUrl: string;
  typeId?: string;
  deviceId?: string;
}) {
  return apiFetch<{ success: boolean; data: WorkItem }>("/works", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
