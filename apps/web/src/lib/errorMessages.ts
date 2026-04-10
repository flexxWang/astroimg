import { ErrorCode } from "@astroimg/shared/error-codes";
import { getApiErrorCode } from "@/services/api";

const ERROR_MESSAGE_OVERRIDE_MAP: Record<string, string> = {
  [ErrorCode.NETWORK_ERROR]: "网络连接异常，请检查网络后重试。",
  [ErrorCode.REQUEST_TIMEOUT]: "请求超时了，请稍后再试。",
};

export function getErrorMessage(
  error: unknown,
  fallback = "操作失败，请稍后再试。",
) {
  const message = error instanceof Error ? error.message : "";
  if (message && message !== "Request failed") {
    return message;
  }

  const code = getApiErrorCode(error);
  if (code && ERROR_MESSAGE_OVERRIDE_MAP[code]) {
    return ERROR_MESSAGE_OVERRIDE_MAP[code];
  }

  return fallback;
}

export function getErrorMessageByCode(code?: string, fallback?: string) {
  if (code && ERROR_MESSAGE_OVERRIDE_MAP[code]) {
    return ERROR_MESSAGE_OVERRIDE_MAP[code];
  }
  return fallback;
}
