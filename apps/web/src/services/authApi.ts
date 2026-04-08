import { apiFetch } from "@/services/api";

export function logout() {
  return apiFetch<null>("/auth/logout", { method: "POST" });
}
