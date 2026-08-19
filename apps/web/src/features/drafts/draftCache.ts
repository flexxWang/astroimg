import type { QueryClient } from "@tanstack/react-query";
import type { DraftItem } from "@/features/drafts/services/draftApi";
import type { ApiResponse } from "@/lib/apiResponse";
import { queryKeys } from "@/lib/queryKeys";

function sortDrafts(items: DraftItem[]) {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
    const bTime = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
    return bTime - aTime;
  });
}

export function upsertDraftInCache(
  queryClient: QueryClient,
  userId: string | null | undefined,
  draft: DraftItem,
) {
  queryClient.setQueryData<ApiResponse<DraftItem[]> | undefined>(
    queryKeys.drafts.list(userId),
    (current) => {
      if (!current) {
        return current;
      }

      const exists = current.data.some((item) => item.id === draft.id);
      const nextDrafts = exists
        ? current.data.map((item) => (item.id === draft.id ? draft : item))
        : [draft, ...current.data];

      return {
        ...current,
        data: sortDrafts(nextDrafts),
      };
    },
  );

  queryClient.setQueryData(queryKeys.drafts.detail(draft.id), draft);
}

export function removeDraftFromCache(
  queryClient: QueryClient,
  userId: string | null | undefined,
  draftId: string,
) {
  queryClient.setQueryData<ApiResponse<DraftItem[]> | undefined>(
    queryKeys.drafts.list(userId),
    (current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        data: current.data.filter((item) => item.id !== draftId),
      };
    },
  );

  queryClient.removeQueries({ queryKey: queryKeys.drafts.detail(draftId) });
}
