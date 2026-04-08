export interface ApiResponse<T> {
  code: number;
  data: T;
  msg: string;
  timestamp?: string;
}

export interface ApiErrorPayload {
  code?: number;
  data?: unknown;
  msg?: string | string[];
  message?: string | string[];
  path?: string;
  errorCode?: string;
  details?: unknown;
  timestamp?: string;
}

export type RequestError = Error & {
  status?: number;
  data?: unknown;
  errorCode?: string;
  details?: unknown;
};

export function isSuccessCode(code: number) {
  return code >= 200 && code < 300;
}

export function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof (value as ApiResponse<unknown>).code === "number" &&
    "data" in (value as Record<string, unknown>) &&
    typeof (value as ApiResponse<unknown>).msg === "string",
  );
}

export function parseApiErrorMessage(
  payload: ApiErrorPayload | ApiResponse<unknown> | string | null,
  fallback: string,
) {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if ("msg" in payload && Array.isArray(payload.msg))
    return payload.msg.join("、");
  if ("msg" in payload && typeof payload.msg === "string") return payload.msg;
  if ("message" in payload && Array.isArray(payload.message))
    return payload.message.join("、");
  if ("message" in payload && typeof payload.message === "string")
    return payload.message;
  return fallback;
}

export function createRequestError(
  payload: ApiErrorPayload | ApiResponse<unknown> | string | null,
  fallback: string,
  status?: number,
) {
  const error: RequestError = new Error(
    parseApiErrorMessage(payload, fallback),
  );
  error.status = status;
  error.data = payload;
  if (payload && typeof payload !== "string") {
    error.errorCode =
      "errorCode" in payload && typeof payload.errorCode === "string"
        ? payload.errorCode
        : undefined;
    error.details = "details" in payload ? payload.details : undefined;
  }
  return error;
}
