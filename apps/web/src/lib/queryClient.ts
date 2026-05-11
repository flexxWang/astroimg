import { QueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/lib/apiClient";

const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 404, 422]);

function shouldRetry(failureCount: number, error: unknown) {
  if (failureCount >= 2) {
    return false;
  }

  const status = (error as ApiError | undefined)?.status;
  if (status && NON_RETRYABLE_STATUSES.has(status)) {
    return false;
  }

  return true;
}

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: shouldRetry,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
