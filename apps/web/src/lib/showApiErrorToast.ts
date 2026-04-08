import { getErrorMessage } from "@/lib/errorMessages";
import { showErrorToast } from "@/lib/showToastMessage";

interface ShowApiErrorToastOptions {
  title?: string;
  fallback?: string;
  dedupeKey?: string;
}

export function showApiErrorToast(
  error: unknown,
  options: ShowApiErrorToastOptions = {},
) {
  const title = options.title ?? "操作失败";
  const message = getErrorMessage(
    error,
    options.fallback ?? "操作失败，请稍后再试。",
  );

  showErrorToast(
    title,
    message,
    options.dedupeKey ?? `api-error::${title}::${message}`,
  );
}
