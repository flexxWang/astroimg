"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "@/features/users/services/userApi";
import { queryKeys } from "@/lib/queryKeys";
import { useUserStore } from "@/stores/userStore";

export function useCurrentUser() {
  const hydrated = useUserStore((state) => state.hydrated);
  const query = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => fetchMe({ errorToast: false, suppressUnauthorized: true }),
    enabled: hydrated,
    staleTime: 5 * 60_000,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    hydrated,
    isAuthenticated: Boolean(query.data?.data),
    user: query.data?.data ?? null,
  };
}
