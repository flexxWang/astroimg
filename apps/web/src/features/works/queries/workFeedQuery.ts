import { infiniteQueryOptions } from "@tanstack/react-query";
import {
  fetchWorksByUserPage,
  fetchWorksPage,
} from "@/features/works/services/workApi";
import { queryKeys } from "@/lib/queryKeys";
import type { Paginated, WorkItem } from "@/lib/types";

export const DEFAULT_WORK_FEED_PAGE_SIZE = 12;

export function createEmptyWorkFeedPage(
  pageSize = DEFAULT_WORK_FEED_PAGE_SIZE,
): Paginated<WorkItem> {
  return {
    items: [],
    page: 1,
    pageSize,
    total: 0,
    hasMore: false,
  };
}

export function workFeedQueryOptions(
  params: {
    pageSize?: number;
    userId?: string;
  },
  initialPage?: Paginated<WorkItem>,
) {
  const pageSize = params.pageSize ?? DEFAULT_WORK_FEED_PAGE_SIZE;
  const userId = params.userId;

  return infiniteQueryOptions({
    queryKey: queryKeys.works.feed({ userId, pageSize }),
    queryFn: ({ pageParam = 1 }) => {
      if (userId) {
        return fetchWorksByUserPage(userId, pageParam, pageSize).then(
          (res) => res.data,
        );
      }

      return fetchWorksPage(pageParam, pageSize).then((res) => res.data);
    },
    initialPageParam: 1,
    initialData: {
      pages: [initialPage ?? createEmptyWorkFeedPage(pageSize)],
      pageParams: [1],
    },
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.page + 1 : undefined,
  });
}
