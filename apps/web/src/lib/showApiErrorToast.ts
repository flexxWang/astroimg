import { getErrorMessage } from "@/lib/errorMessages";
import { showErrorToast } from "@/lib/showToastMessage";
import { getApiErrorCode, getApiErrorStatus } from "@/lib/apiClient";
import { ErrorCode } from "@astroimg/shared/error-codes";

export interface ShowApiErrorToastOptions {
  title?: string;
  fallback?: string;
  dedupeKey?: string;
}

function inferErrorTitle(error: unknown) {
  const errorCode = getApiErrorCode(error);
  const status = getApiErrorStatus(error);

  if (errorCode === ErrorCode.NETWORK_ERROR) return "网络异常";
  if (errorCode === ErrorCode.REQUEST_TIMEOUT || status === 408)
    return "请求超时";
  if (status === 400) return "请求错误";
  if (status === 401) return "未登录或登录失效";
  if (status === 403) return "无权限操作";
  if (status === 404) return "内容不存在";
  if (status === 409) return "操作冲突";
  if (status && status >= 500) return "服务异常";

  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("load failed") ||
    message.includes("network request failed")
  ) {
    return "网络异常";
  }

  return "操作失败";
}

export function showApiErrorToast(
  error: unknown,
  options: ShowApiErrorToastOptions = {},
) {
  if ((error as { toastShown?: boolean } | undefined)?.toastShown) {
    return;
  }

  const title = options.title ?? inferErrorTitle(error);
  const message = getErrorMessage(
    error,
    options.fallback ?? "操作失败，请稍后再试。",
  );

  showErrorToast(
    title,
    message,
    options.dedupeKey ?? `api-error::${title}::${message}`,
  );

  if (error && typeof error === "object") {
    (error as { toastShown?: boolean }).toastShown = true;
  }
}
