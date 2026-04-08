export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

type JsonLike = object | Array<unknown> | number | boolean | null;

export interface ErrorPayload {
  success?: false;
  statusCode?: number;
  path?: string;
  message?: string | string[];
  errorCode?: string;
  details?: unknown;
  timestamp?: string;
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | JsonLike;
  timeout?: number;
}

export type ApiError = Error & {
  status?: number;
  data?: unknown;
  errorCode?: string;
  details?: unknown;
};

function isBodyLike(value: unknown) {
  return (
    value instanceof FormData ||
    value instanceof Blob ||
    value instanceof ArrayBuffer ||
    value instanceof URLSearchParams
  );
}

function parseErrorMessage(payload: ErrorPayload | string | null, fallback: string) {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (Array.isArray(payload?.message)) return payload.message.join("、");
  if (typeof payload?.message === "string") return payload.message;
  return fallback;
}

export function getApiErrorCode(error: unknown) {
  return (error as ApiError | undefined)?.errorCode;
}

export function isApiErrorCode(error: unknown, code: string) {
  return getApiErrorCode(error) === code;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}) {
  const headers = new Headers(options.headers);
  const timeout = (options as any).timeout ?? 15000;

  let body: BodyInit | undefined;
  const rawBody = options.body;
  if (rawBody && typeof rawBody === "object" && !isBodyLike(rawBody)) {
    body = JSON.stringify(rawBody);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  } else if (typeof rawBody === "string" && !headers.has("Content-Type")) {
    body = rawBody;
    headers.set("Content-Type", "application/json");
  } else if (rawBody != null) {
    body = rawBody as BodyInit;
  } else if (!headers.has("Content-Type")) {
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
      const normalizedPayload =
        typeof payload === "string" ? payload : (payload as ErrorPayload | null);
      const message = parseErrorMessage(normalizedPayload, "Request failed");
      const error: ApiError = new Error(message);
      error.status = response.status;
      error.data = payload;
      if (normalizedPayload && typeof normalizedPayload !== "string") {
        error.errorCode = normalizedPayload.errorCode;
        error.details = normalizedPayload.details;
      }
      if (response.status === 401 && typeof window !== "undefined") {
        const currentPath = window.location.pathname + window.location.search;
        if (!window.location.pathname.startsWith("/login")) {
          const next = encodeURIComponent(currentPath);
          window.location.href = `/login?next=${next}`;
        }
      }
      throw error;
    }

    return (await response.json()) as T;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      const error: ApiError = new Error("请求超时");
      error.status = 408;
      error.errorCode = "REQUEST_TIMEOUT";
      throw error;
    }
    throw err;
  } finally {
    clearTimer(timer);
  }
}
