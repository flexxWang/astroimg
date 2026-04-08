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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout ?? 15000);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      cache: "no-store",
      headers,
      signal: controller.signal,
    });

    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      try {
        payload = await res.text();
      } catch {
        payload = null;
      }
    }

    if (!res.ok) {
      throw createRequestError(
        typeof payload === "string"
          ? payload
          : (payload as ApiErrorPayload | null),
        `Request failed: ${res.status}`,
        res.status,
      );
    }

    if (!isApiResponse(payload)) {
      throw createRequestError(
        null,
        "接口响应格式异常，请稍后再试。",
        res.status,
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
      const error = new Error("请求超时") as Error & { status?: number };
      (error as any).status = 408;
      throw error;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
