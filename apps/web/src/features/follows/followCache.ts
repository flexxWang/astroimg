import type { QueryClient } from "@tanstack/react-query";
import type { ApiResponse } from "@/lib/apiResponse";
import { queryKeys } from "@/lib/queryKeys";
import type { UserProfile } from "@/lib/types";

export function syncFollowState(
  queryClient: QueryClient,
  userId: string,
  following: boolean,
) {
  queryClient.setQueryData(queryKeys.follows.status(userId), { following });
  queryClient.setQueryData<UserProfile | ApiResponse<UserProfile> | undefined>(
    queryKeys.users.profile(userId),
    (current) => {
      if (!current) {
        return current;
      }

      const applyStats = (profile: UserProfile) => ({
        ...profile,
        stats: profile.stats
          ? {
              ...profile.stats,
              followers: Math.max(
                0,
                profile.stats.followers + (following ? 1 : -1),
              ),
            }
          : profile.stats,
      });

      if ("data" in current) {
        return {
          ...current,
          data: applyStats(current.data),
        };
      }

      return applyStats(current);
    },
  );
}
