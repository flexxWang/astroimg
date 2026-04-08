export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

import {
  createRequestError,
  isApiResponse,
  isSuccessCode,
  type ApiErrorPayload,
  type ApiResponse,
  type RequestError,
} from "@/lib/apiResponse";

type JsonLike = object | Array<unknown> | number | boolean | null;

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | JsonLike;
  timeout?: number;
}

export type ApiError = RequestError;

function isBodyLike(value: unknown) {
  return (
    value instanceof FormData ||
    value instanceof Blob ||
    value instanceof ArrayBuffer ||
    value instanceof URLSearchParams
  );
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

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      try {
        payload = await response.text();
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      const normalizedPayload =
        typeof payload === "string"
          ? payload
          : (payload as ApiErrorPayload | null);
      const error = createRequestError(
        normalizedPayload,
        "Request failed",
        response.status,
      );
      if (response.status === 401 && typeof window !== "undefined") {
        const currentPath = window.location.pathname + window.location.search;
        if (!window.location.pathname.startsWith("/login")) {
          const next = encodeURIComponent(currentPath);
          window.location.href = `/login?next=${next}`;
        }
      }
      throw error;
    }

    if (!isApiResponse(payload)) {
      throw createRequestError(
        null,
        "接口响应格式异常，请稍后再试。",
        response.status,
      );
    }

    if (!isSuccessCode(payload.code)) {
      throw createRequestError(payload, "Request failed", payload.code);
    }

    return payload as ApiResponse<T>;
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
