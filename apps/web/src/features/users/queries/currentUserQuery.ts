import {
  queryOptions,
  type QueryClient,
} from "@tanstack/react-query";
import { fetchMe } from "@/features/users/services/userApi";
import { queryKeys } from "@/lib/queryKeys";

export function currentUserQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.auth.me(),
    queryFn: () => fetchMe({ errorToast: false, suppressUnauthorized: true }),
    staleTime: 5 * 60_000,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function refreshCurrentUser(queryClient: QueryClient) {
  return queryClient.fetchQuery(currentUserQueryOptions());
}
