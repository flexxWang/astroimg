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
import {
  showApiErrorToast,
  type ShowApiErrorToastOptions,
} from "@/lib/showApiErrorToast";
import { ErrorCode } from "@astroimg/shared/error-codes";

type JsonLike = object | Array<unknown> | number | boolean | null;

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | JsonLike;
  timeout?: number;
  errorToast?: false | ShowApiErrorToastOptions;
  authRefresh?: false;
  authRedirect?: false;
}

export type ApiError = RequestError;

let refreshPromise: Promise<boolean> | null = null;

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

export function getApiErrorStatus(error: unknown) {
  return (error as ApiError | undefined)?.status;
}

export function isApiErrorCode(error: unknown, code: string) {
  return getApiErrorCode(error) === code;
}

function showGlobalErrorToast(
  error: ApiError,
  errorToast?: false | ShowApiErrorToastOptions,
) {
  if (errorToast === false || typeof window === "undefined") {
    return;
  }

  showApiErrorToast(error, errorToast ?? {});
}

async function readResponsePayload(response: Response) {
  try {
    return await response.json();
  } catch {
    try {
      return await response.text();
    } catch {
      return null;
    }
  }
}

async function refreshAccessToken() {
  if (typeof window === "undefined") {
    return false;
  }

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          return false;
        }

        const payload = await readResponsePayload(response);
        return isApiResponse(payload) && isSuccessCode(payload.code);
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function redirectToLogin() {
  if (typeof window === "undefined") {
    return;
  }

  const currentPath = window.location.pathname + window.location.search;
  if (!window.location.pathname.startsWith("/login")) {
    const next = encodeURIComponent(currentPath);
    window.location.href = `/login?next=${next}`;
  }
}

async function request<T>(
  path: string,
  requestOptions: Omit<ApiOptions, "timeout" | "errorToast" | "authRefresh">,
  body: BodyInit | undefined,
  headers: Headers,
  signal: AbortSignal,
) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...requestOptions,
    body,
    headers,
    credentials: "include",
    signal,
  });

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    const normalizedPayload =
      typeof payload === "string"
        ? payload
        : (payload as ApiErrorPayload | null);
    throw createRequestError(
      normalizedPayload,
      "Request failed",
      response.status,
    );
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
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}) {
  const {
    timeout = 15000,
    errorToast,
    authRefresh = true,
    authRedirect = true,
    ...requestOptions
  } = options;
  const headers = new Headers(requestOptions.headers);

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
  if (requestOptions.signal) {
    requestOptions.signal.addEventListener("abort", () => controller.abort(), {
      once: true,
    });
  }

  try {
    try {
      return await request<T>(
        path,
        requestOptions,
        body,
        headers,
        controller.signal,
      );
    } catch (err) {
      const error = err as ApiError;
      const canRefresh =
        authRefresh !== false &&
        error.status === 401 &&
        typeof window !== "undefined" &&
        path !== "/auth/refresh" &&
        path !== "/auth/login" &&
        path !== "/auth/register" &&
        path !== "/auth/logout";

      if (canRefresh && (await refreshAccessToken())) {
        return await request<T>(
          path,
          requestOptions,
          body,
          headers,
          controller.signal,
        );
      }

      if (canRefresh && authRedirect !== false) {
        redirectToLogin();
      }

      throw error;
    }
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      const error: ApiError = new Error("请求超时");
      error.status = 408;
      error.errorCode = ErrorCode.REQUEST_TIMEOUT;
      showGlobalErrorToast(error, errorToast);
      throw error;
    }

    const error =
      err instanceof Error
        ? (err as ApiError)
        : createRequestError(null, "网络异常，请稍后再试。");

    if (
      !error.status &&
      !error.errorCode &&
      error.message &&
      error.message !== "Request failed"
    ) {
      const normalizedError = createRequestError(
        error.message,
        "网络异常，请稍后再试。",
      );
      normalizedError.errorCode = ErrorCode.NETWORK_ERROR;
      showGlobalErrorToast(normalizedError, errorToast);
      throw normalizedError;
    }

    showGlobalErrorToast(error, errorToast);
    throw error;
  } finally {
    clearTimer(timer);
  }
}

export async function ensureFreshSession() {
  return refreshAccessToken();
}
