import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiResponse } from "@/lib/apiResponse";
import type { Paginated, WorkItem } from "@/lib/types";

function updateWorkItem(
  work: WorkItem,
  workId: string,
  updates: Partial<Pick<WorkItem, "commentCount" | "likeCount">>,
) {
  if (work.id !== workId) {
    return work;
  }

  return {
    ...work,
    ...updates,
  };
}

function updateWorkList(
  current: Paginated<WorkItem>,
  workId: string,
  updates: Partial<Pick<WorkItem, "commentCount" | "likeCount">>,
) {
  return {
    ...current,
    items: current.items.map((work) => updateWorkItem(work, workId, updates)),
  };
}

export function syncWorkLikeState(
  queryClient: QueryClient,
  workId: string,
  liked: boolean,
  likeCount: number,
) {
  queryClient.setQueryData(queryKeys.works.likeStatus(workId), { liked });
  queryClient.setQueryData<WorkItem | ApiResponse<WorkItem> | undefined>(
    queryKeys.works.detail(workId),
    (current) => {
      if (!current) {
        return current;
      }

      if ("data" in current) {
        return {
          ...current,
          data: updateWorkItem(current.data, workId, { likeCount }),
        };
      }

      return updateWorkItem(current, workId, { likeCount });
    },
  );
  queryClient.setQueriesData<
    InfiniteData<Paginated<WorkItem>, number> | undefined
  >({ queryKey: queryKeys.works.all() }, (current) => {
    if (!current?.pages?.length) {
      return current;
    }

    return {
      ...current,
      pages: current.pages.map((page) => updateWorkList(page, workId, { likeCount })),
    };
  });
}

export function syncWorkCommentCount(
  queryClient: QueryClient,
  workId: string,
  commentCount: number,
) {
  queryClient.setQueryData<WorkItem | ApiResponse<WorkItem> | undefined>(
    queryKeys.works.detail(workId),
    (current) => {
      if (!current) {
        return current;
      }

      if ("data" in current) {
        return {
          ...current,
          data: updateWorkItem(current.data, workId, { commentCount }),
        };
      }

      return updateWorkItem(current, workId, { commentCount });
    },
  );
  queryClient.setQueriesData<
    InfiniteData<Paginated<WorkItem>, number> | undefined
  >({ queryKey: queryKeys.works.all() }, (current) => {
    if (!current?.pages?.length) {
      return current;
    }

    return {
      ...current,
      pages: current.pages.map((page) =>
        updateWorkList(page, workId, { commentCount }),
      ),
    };
  });
}
