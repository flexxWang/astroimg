import { apiFetch } from "@/lib/apiClient";

export function logout() {
  return apiFetch<null>("/auth/logout", { method: "POST" });
}
