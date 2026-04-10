import { apiFetch } from "@/services/api";

export function register(payload: {
  username: string;
  email: string;
  password: string;
}) {
  return apiFetch<{ accessToken: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
    errorToast: {
      title: "注册失败",
      fallback: "注册失败，请稍后再试。",
    },
  });
}

export function login(payload: { usernameOrEmail: string; password: string }) {
  return apiFetch<{ accessToken: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    errorToast: {
      title: "登录失败",
      fallback: "登录失败，请稍后再试。",
    },
  });
}

export function fetchMe() {
  return apiFetch<{ id: string; username: string }>("/users/me");
}
