export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

interface ApiOptions extends RequestInit {
  token?: string | null;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Request failed");
  }

  return (await response.json()) as T;
}
