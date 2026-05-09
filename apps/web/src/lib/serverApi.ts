import * as Sentry from "@sentry/nextjs";
import {
  createRequestError,
  isApiResponse,
  isSuccessCode,
  type ApiErrorPayload,
  type ApiResponse,
} from "@/lib/apiResponse";

const API_BASE =
  process.env.API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://127.0.0.1:4000";

type ServerFetchError = Error & {
  status?: number;
};

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isUnsafeMethod(method?: string) {
  return UNSAFE_METHODS.has((method || "GET").toUpperCase());
}

function readCookieValue(cookieHeader: string, name: string) {
  const prefix = `${name}=`;
  const item = cookieHeader
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(prefix));

  if (!item) {
    return null;
  }

  return decodeURIComponent(item.slice(prefix.length));
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

async function refreshServerAccessToken(cookieHeader: string) {
  if (!cookieHeader) {
    return null;
  }

  try {
    const headers = new Headers({
      Cookie: cookieHeader,
      "Content-Type": "application/json",
    });
    const csrfToken = readCookieValue(cookieHeader, "csrf_token");
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }

    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      cache: "no-store",
      headers,
    });

    if (!response.ok) {
      return null;
    }

    const payload = await readResponsePayload(response);
    if (!isApiResponse(payload) || !isSuccessCode(payload.code)) {
      return null;
    }

    const data = payload.data as { accessToken?: unknown };
    return typeof data.accessToken === "string" ? data.accessToken : null;
  } catch {
    return null;
  }
}

async function captureServerFetchError(
  error: unknown,
  path: string,
  options: RequestInit,
) {
  const method = options.method || "GET";
  const reportError =
    error instanceof Error
      ? new Error(`SSR serverFetch failed: ${method} ${path}`, {
          cause: error,
        })
      : new Error(`SSR serverFetch failed: ${method} ${path}`);

  const configureScope = (scope: {
    setLevel: (value: "error") => void;
    setTag: (key: string, value: string) => void;
    setFingerprint: (value: string[]) => void;
    setContext: (name: string, context: Record<string, unknown>) => void;
    setExtra: (key: string, value: unknown) => void;
  }) => {
    scope.setLevel("error");
    scope.setTag("fetch_layer", "server");
    scope.setFingerprint(["serverFetch", method, path]);
    scope.setContext("server_fetch", {
      path,
      url: `${API_BASE}${path}`,
      method,
      hasBody: options.body !== undefined,
    });
    scope.setExtra(
      "original_error",
      error instanceof Error ? error.message : String(error),
    );
  };

  Sentry.withScope((scope) => {
    configureScope(scope);
    Sentry.captureException(reportError);
    Sentry.captureMessage(`SSR serverFetch failed: ${method} ${path}`, "error");
  });

  try {
    await Sentry.flush(2_000);
  } catch {
    // Swallow flush failures so API errors still surface to the caller.
  }
}

export async function serverFetch<T>(
  path: string,
  options: RequestInit & { timeout?: number } = {},
) {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join("; ");

  const headers = new Headers(options.headers);
  if (cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }
  if (isUnsafeMethod(options.method) && !headers.has("X-CSRF-Token")) {
    const csrfToken = readCookieValue(cookieHeader, "csrf_token");
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout ?? 15000);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      cache: "no-store",
      headers,
      signal: controller.signal,
    });

    let response = res;
    let payload = await readResponsePayload(response);

    if (!response.ok && response.status === 401) {
      const accessToken = await refreshServerAccessToken(cookieHeader);
      if (accessToken) {
        const retryHeaders = new Headers(headers);
        retryHeaders.set("Authorization", `Bearer ${accessToken}`);
        response = await fetch(`${API_BASE}${path}`, {
          ...options,
          cache: "no-store",
          headers: retryHeaders,
          signal: controller.signal,
        });
        payload = await readResponsePayload(response);
      }
    }

    if (!response.ok) {
      throw createRequestError(
        typeof payload === "string"
          ? payload
          : (payload as ApiErrorPayload | null),
        `Request failed: ${response.status}`,
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
      throw createRequestError(
        payload,
        `Request failed: ${payload.code}`,
        payload.code,
      );
    }

    return payload as ApiResponse<T>;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      const error: ServerFetchError = new Error("请求超时");
      error.status = 408;
      await captureServerFetchError(error, path, options);
      throw error;
    }

    await captureServerFetchError(err, path, options);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
