import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { PostListItem } from "@/features/posts/services/postApi";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiResponse } from "@/lib/apiResponse";
import type { Paginated } from "@/lib/types";

function updatePostItem(
  post: PostListItem,
  postId: string,
  updates: Partial<Pick<PostListItem, "commentCount" | "likeCount">>,
) {
  if (post.id !== postId) {
    return post;
  }

  return {
    ...post,
    ...updates,
  };
}

function updatePostList(
  current: Paginated<PostListItem>,
  postId: string,
  updates: Partial<Pick<PostListItem, "commentCount" | "likeCount">>,
) {
  return {
    ...current,
    items: current.items.map((post) => updatePostItem(post, postId, updates)),
  };
}

export function syncPostLikeState(
  queryClient: QueryClient,
  postId: string,
  liked: boolean,
  likeCount: number,
) {
  queryClient.setQueryData(queryKeys.posts.likeStatus(postId), { liked });
  queryClient.setQueryData<PostListItem | ApiResponse<PostListItem> | undefined>(
    queryKeys.posts.detail(postId),
    (current) => {
      if (!current) {
        return current;
      }

      if ("data" in current) {
        return {
          ...current,
          data: updatePostItem(current.data, postId, { likeCount }),
        };
      }

      return updatePostItem(current, postId, { likeCount });
    },
  );
  queryClient.setQueryData<ApiResponse<Paginated<PostListItem>> | undefined>(
    queryKeys.posts.list(),
    (current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        data: updatePostList(current.data, postId, { likeCount }),
      };
    },
  );
  queryClient.setQueriesData<
    InfiniteData<Paginated<PostListItem>, number> | undefined
  >({ queryKey: queryKeys.posts.all() }, (current) => {
    if (!current?.pages?.length) {
      return current;
    }

    return {
      ...current,
      pages: current.pages.map((page) => updatePostList(page, postId, { likeCount })),
    };
  });
}

export function syncPostCommentCount(
  queryClient: QueryClient,
  postId: string,
  commentCount: number,
) {
  queryClient.setQueryData<PostListItem | ApiResponse<PostListItem> | undefined>(
    queryKeys.posts.detail(postId),
    (current) => {
      if (!current) {
        return current;
      }

      if ("data" in current) {
        return {
          ...current,
          data: updatePostItem(current.data, postId, { commentCount }),
        };
      }

      return updatePostItem(current, postId, { commentCount });
    },
  );
  queryClient.setQueryData<ApiResponse<Paginated<PostListItem>> | undefined>(
    queryKeys.posts.list(),
    (current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        data: updatePostList(current.data, postId, { commentCount }),
      };
    },
  );
  queryClient.setQueriesData<
    InfiniteData<Paginated<PostListItem>, number> | undefined
  >({ queryKey: queryKeys.posts.all() }, (current) => {
    if (!current?.pages?.length) {
      return current;
    }

    return {
      ...current,
      pages: current.pages.map((page) =>
        updatePostList(page, postId, { commentCount }),
      ),
    };
  });
}
