import { infiniteQueryOptions } from "@tanstack/react-query";
import {
  fetchPostsByUserPage,
  fetchPostsPage,
  type PostListItem,
} from "@/features/posts/services/postApi";
import { queryKeys } from "@/lib/queryKeys";
import type { Paginated } from "@/lib/types";

export const DEFAULT_POST_FEED_PAGE_SIZE = 10;

export function createEmptyPostFeedPage(
  pageSize = DEFAULT_POST_FEED_PAGE_SIZE,
): Paginated<PostListItem> {
  return {
    items: [],
    page: 1,
    pageSize,
    total: 0,
    hasMore: false,
  };
}

export function postFeedQueryOptions(
  params: {
    keyword?: string;
    pageSize?: number;
    userId?: string;
  },
  initialPage?: Paginated<PostListItem>,
) {
  const pageSize = params.pageSize ?? DEFAULT_POST_FEED_PAGE_SIZE;
  const userId = params.userId;
  const keyword = params.keyword;

  return infiniteQueryOptions({
    queryKey: queryKeys.posts.feed({
      userId,
      pageSize,
      keyword,
    }),
    queryFn: ({ pageParam = 1 }) => {
      if (userId) {
        return fetchPostsByUserPage(userId, pageParam, pageSize).then(
          (res) => res.data,
        );
      }

      return fetchPostsPage(pageParam, pageSize, keyword).then((res) => res.data);
    },
    initialPageParam: 1,
    initialData: {
      pages: [initialPage ?? createEmptyPostFeedPage(pageSize)],
      pageParams: [1],
    },
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.page + 1 : undefined,
  });
}
