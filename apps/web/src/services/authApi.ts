import { apiFetch } from "@/services/api";

export function logout() {
  return apiFetch<{ success: boolean; data: { success: boolean } }>(
    "/auth/logout",
    { method: "POST" },
  );
}
