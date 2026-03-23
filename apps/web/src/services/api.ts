export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

interface ApiOptions extends RequestInit {}

type ApiError = Error & { status?: number; data?: unknown };

function isBodyLike(value: unknown) {
  return (
    value instanceof FormData ||
    value instanceof Blob ||
    value instanceof ArrayBuffer ||
    value instanceof URLSearchParams
  );
}

function parseErrorMessage(payload: any, fallback: string) {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (Array.isArray(payload?.message)) return payload.message.join("、");
  if (typeof payload?.message === "string") return payload.message;
  return fallback;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}) {
  const headers = new Headers(options.headers);
  const timeout = (options as any).timeout ?? 15000;

  let body = options.body;
  if (body && typeof body === "object" && !isBodyLike(body)) {
    body = JSON.stringify(body);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  } else if (typeof body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  } else if (!body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const setTimer =
    typeof window !== "undefined" ? window.setTimeout : setTimeout;
  const clearTimer =
    typeof window !== "undefined" ? window.clearTimeout : clearTimeout;
  const timer = setTimer(() => controller.abort(), timeout);
  if (options.signal) {
    options.signal.addEventListener("abort", () => controller.abort(), {
      once: true,
    });
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      body,
      headers,
      credentials: "include",
      signal: controller.signal,
    });

    if (!response.ok) {
      let payload: any = null;
      try {
        payload = await response.json();
      } catch {
        payload = await response.text();
      }
      const message = parseErrorMessage(payload, "Request failed");
      const error: ApiError = new Error(message);
      error.status = response.status;
      error.data = payload;
      if (response.status === 401 && typeof window !== "undefined") {
        const next = encodeURIComponent(
          window.location.pathname + window.location.search,
        );
        window.location.href = `/login?next=${next}`;
      }
      throw error;
    }

    return (await response.json()) as T;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      const error: ApiError = new Error("请求超时");
      error.status = 408;
      throw error;
    }
    throw err;
  } finally {
    clearTimer(timer);
  }
}
