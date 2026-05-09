import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
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

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

type JsonLike = object | Array<unknown> | number | boolean | null;

interface ApiOptions
  extends Omit<
    AxiosRequestConfig,
    "baseURL" | "data" | "timeout" | "url" | "withCredentials"
  > {
  body?: BodyInit | JsonLike | string;
  timeout?: number;
  errorToast?: false | ShowApiErrorToastOptions;
  authRefresh?: false;
  authRedirect?: false;
}

export type ApiError = RequestError;

let refreshPromise: Promise<boolean> | null = null;
let csrfPromise: Promise<string | null> | null = null;

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const DEFAULT_TIMEOUT = 15000;

const http = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
  validateStatus: () => true,
});

const csrfHttp = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
  validateStatus: () => true,
});

type ApiAxiosConfig = InternalAxiosRequestConfig & {
  skipCsrf?: boolean;
};

function isUnsafeMethod(method?: string) {
  return UNSAFE_METHODS.has((method || "GET").toUpperCase());
}

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${name}=`;
  const item = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(prefix));

  if (!item) {
    return null;
  }

  return decodeURIComponent(item.slice(prefix.length));
}

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

function headersToObject(headers: Headers) {
  return Object.fromEntries(headers.entries());
}

function getHeaderValue(
  headers: InternalAxiosRequestConfig["headers"],
  name: string,
) {
  if (!headers) {
    return undefined;
  }

  const maybeHeaders = headers as {
    get?: (headerName: string) => unknown;
    [key: string]: unknown;
  };

  const value = maybeHeaders.get?.(name);
  if (value !== undefined && value !== null) {
    return String(value);
  }

  return Object.entries(maybeHeaders).find(
    ([key]) => key.toLowerCase() === name.toLowerCase(),
  )?.[1];
}

function toRequestError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED" || error.code === "ERR_CANCELED") {
      const timeoutError: ApiError = new Error("请求超时");
      timeoutError.status = 408;
      timeoutError.errorCode = ErrorCode.REQUEST_TIMEOUT;
      return timeoutError;
    }

    const payload = error.response?.data;
    if (error.response) {
      return createRequestError(
        typeof payload === "string"
          ? payload
          : (payload as ApiErrorPayload | null),
        "Request failed",
        error.response.status,
      );
    }

    const networkError = createRequestError(
      error.message,
      "网络异常，请稍后再试。",
    );
    networkError.errorCode = ErrorCode.NETWORK_ERROR;
    return networkError;
  }

  if (error instanceof Error) {
    return error as ApiError;
  }

  return createRequestError(null, "网络异常，请稍后再试。");
}

function createHttpError(response: { data: unknown; status: number }) {
  const payload = response.data;
  return createRequestError(
    typeof payload === "string" ? payload : (payload as ApiErrorPayload | null),
    "Request failed",
    response.status,
  );
}

function normalizeApiResponse<T>(payload: unknown, status: number) {
  if (!isApiResponse(payload)) {
    throw createRequestError(
      null,
      "接口响应格式异常，请稍后再试。",
      status,
    );
  }

  if (!isSuccessCode(payload.code)) {
    throw createRequestError(payload, "Request failed", payload.code);
  }

  return payload as ApiResponse<T>;
}

function prepareBodyAndHeaders(
  rawBody: ApiOptions["body"],
  headers: Headers,
) {
  if (rawBody && typeof rawBody === "object" && !isBodyLike(rawBody)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return rawBody;
  }

  if (typeof rawBody === "string") {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    try {
      return JSON.parse(rawBody);
    } catch {
      return rawBody;
    }
  }

  if (rawBody != null) {
    return rawBody;
  }

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return undefined;
}

async function fetchCsrfToken() {
  if (typeof window === "undefined") {
    return null;
  }

  const existing = readCookie("csrf_token");
  if (existing) {
    return existing;
  }

  if (!csrfPromise) {
    csrfPromise = csrfHttp
      .get("/auth/csrf", {
        timeout: DEFAULT_TIMEOUT,
      })
      .then((response) => {
        if (response.status < 200 || response.status >= 300) {
          return null;
        }

        const payload = response.data;
        if (isApiResponse(payload) && isSuccessCode(payload.code)) {
          const data = payload.data as { csrfToken?: unknown } | null;
          if (typeof data?.csrfToken === "string") {
            return data.csrfToken;
          }
        }

        return readCookie("csrf_token");
      })
      .catch(() => null)
      .finally(() => {
        csrfPromise = null;
      });
  }

  return csrfPromise;
}

export async function attachCsrfHeader(
  headers: Headers,
  method?: string,
): Promise<Headers> {
  if (!isUnsafeMethod(method) || headers.has("X-CSRF-Token")) {
    return headers;
  }

  const token = readCookie("csrf_token") ?? (await fetchCsrfToken());
  if (token) {
    headers.set("X-CSRF-Token", token);
  }

  return headers;
}

async function refreshAccessToken() {
  if (typeof window === "undefined") {
    return false;
  }

  if (!refreshPromise) {
    const headers = new Headers({
      "Content-Type": "application/json",
    });
    refreshPromise = http
      .post(
        "/auth/refresh",
        undefined,
        {
          headers: headersToObject(await attachCsrfHeader(headers, "POST")),
          timeout: DEFAULT_TIMEOUT,
        },
      )
      .then((response) => {
        if (response.status < 200 || response.status >= 300) {
          return false;
        }

        return isApiResponse(response.data) && isSuccessCode(response.data.code);
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

http.interceptors.request.use(async (config: ApiAxiosConfig) => {
  const headers = new Headers(config.headers as HeadersInit);

  if (!config.skipCsrf) {
    await attachCsrfHeader(headers, config.method);
  }

  if (!getHeaderValue(config.headers, "Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  config.headers = {
    ...config.headers,
    ...headersToObject(headers),
  } as InternalAxiosRequestConfig["headers"];

  return config;
});

http.interceptors.response.use(
  (response) => {
    if (response.status < 200 || response.status >= 300) {
      throw createHttpError(response);
    }

    response.data = normalizeApiResponse(response.data, response.status);
    return response;
  },
  (error: AxiosError) => Promise.reject(toRequestError(error)),
);

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
  requestOptions: Omit<ApiOptions, "body" | "errorToast" | "authRefresh">,
  data: unknown,
) {
  try {
    const response = await http.request({
      ...requestOptions,
      url: path,
      data,
      timeout: requestOptions.timeout ?? DEFAULT_TIMEOUT,
    });

    return response.data as ApiResponse<T>;
  } catch (error) {
    throw toRequestError(error);
  }
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}) {
  const {
    body,
    timeout = DEFAULT_TIMEOUT,
    errorToast,
    authRefresh = true,
    authRedirect = true,
    ...requestOptions
  } = options;
  const headers = new Headers(requestOptions.headers as HeadersInit);
  const data = prepareBodyAndHeaders(body, headers);
  requestOptions.headers = headersToObject(headers);

  try {
    try {
      return await request<T>(
        path,
        { ...requestOptions, timeout },
        data,
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
          { ...requestOptions, timeout },
          data,
        );
      }

      if (canRefresh && authRedirect !== false) {
        redirectToLogin();
      }

      throw error;
    }
  } catch (err) {
    const error = toRequestError(err);
    showGlobalErrorToast(error, errorToast);
    throw error;
  }
}

export async function ensureFreshSession() {
  return refreshAccessToken();
}
