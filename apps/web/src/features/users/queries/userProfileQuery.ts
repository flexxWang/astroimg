import { queryOptions } from "@tanstack/react-query";
import { fetchUserProfile } from "@/features/users/services/userApi";
import { queryKeys } from "@/lib/queryKeys";
import type { UserProfile } from "@/lib/types";

export function userProfileQueryOptions(
  userId: string,
  initialData?: UserProfile,
) {
  return queryOptions({
    queryKey: queryKeys.users.profile(userId),
    queryFn: () => fetchUserProfile(userId).then((result) => result.data),
    ...(initialData ? { initialData } : {}),
  });
}
