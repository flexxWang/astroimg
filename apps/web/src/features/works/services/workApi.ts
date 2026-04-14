import { apiFetch } from "@/lib/apiClient";
import type { Paginated, WorkDevice, WorkItem, WorkType } from "@/lib/types";

export function fetchWorksPage(page = 1, pageSize = 20) {
  return apiFetch<Paginated<WorkItem>>(
    `/works?page=${page}&pageSize=${pageSize}`,
  );
}

export function fetchWorkTypes() {
  return apiFetch<WorkType[]>("/works/types");
}

export function fetchWorkDevices() {
  return apiFetch<WorkDevice[]>("/works/devices");
}

export function createWork(payload: {
  title: string;
  description?: string;
  mediaType: "image" | "video";
  imageUrls?: string[];
  videoUrl?: string;
  typeId?: string;
  deviceId?: string;
}) {
  return apiFetch<WorkItem>("/works", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchWorksByUserPage(userId: string, page = 1, pageSize = 20) {
  return apiFetch<Paginated<WorkItem>>(
    `/works/user/${userId}?page=${page}&pageSize=${pageSize}`,
  );
}
