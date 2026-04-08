const API_BASE =
  process.env.API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://127.0.0.1:4000";

type ServerErrorPayload = {
  message?: string | string[];
  errorCode?: string;
  details?: unknown;
};

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
  const timer = setTimeout(
    () => controller.abort(),
    options.timeout ?? 15000,
  );

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      cache: "no-store",
      headers,
      signal: controller.signal,
    });
    if (!res.ok) {
      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        payload = await res.text();
      }
      const payloadMessage =
        payload && typeof payload === "object"
          ? (payload as ServerErrorPayload).message
          : undefined;
      const message =
        Array.isArray(payloadMessage)
          ? payloadMessage.join("、")
          : typeof payloadMessage === "string"
            ? payloadMessage
          : typeof payload === "string"
            ? payload
            : `Request failed: ${res.status}`;
      const error = new Error(message) as Error & {
        status?: number;
        data?: unknown;
        errorCode?: string;
        details?: unknown;
      };
      (error as any).status = res.status;
      (error as any).data = payload;
      if (payload && typeof payload === "object") {
        (error as any).errorCode = (payload as ServerErrorPayload).errorCode;
        (error as any).details = (payload as ServerErrorPayload).details;
      }
      throw error;
    }
    return (await res.json()) as T;
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
