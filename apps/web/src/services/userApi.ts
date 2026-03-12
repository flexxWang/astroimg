import { apiFetch } from "@/services/api";

export function register(payload: {
  username: string;
  email: string;
  password: string;
}) {
  return apiFetch<{ success: boolean; data: { accessToken: string } }>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function login(payload: { usernameOrEmail: string; password: string }) {
  return apiFetch<{ success: boolean; data: { accessToken: string } }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function fetchMe() {
  return apiFetch<{ success: boolean; data: { id: string; username: string } }>(
    "/users/me",
  );
}
