export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

interface ApiOptions extends RequestInit {}

export async function apiFetch<T>(path: string, options: ApiOptions = {}) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(errorText || "Request failed");
    (error as any).status = response.status;
    throw error;
  }

  return (await response.json()) as T;
}
