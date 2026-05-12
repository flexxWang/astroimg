"use client";

import { useCallback, useMemo } from "react";
import {
  type InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchMessages,
  type MessageItem,
} from "@/features/messages/services/messageApi";
import { queryKeys } from "@/lib/queryKeys";

const MESSAGE_PAGE_SIZE = 20;

export function useConversationMessages(conversationId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.messages.thread(conversationId ?? "pending");
  const query = useInfiniteQuery<
    MessageItem[],
    Error,
    InfiniteData<MessageItem[], string | undefined>,
    typeof queryKey,
    string | undefined
  >({
    queryKey,
    queryFn: ({ pageParam }) =>
      fetchMessages(conversationId!, pageParam).then((result) => result.data),
    enabled: Boolean(conversationId),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: () => undefined,
    getPreviousPageParam: (firstPage) => {
      if (firstPage.length < MESSAGE_PAGE_SIZE) {
        return undefined;
      }

      return firstPage[0]?.createdAt;
    },
  });

  const messages = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page),
    [query.data?.pages],
  );

  const appendMessage = useCallback(
    (message: MessageItem) => {
      queryClient.setQueryData<
        InfiniteData<MessageItem[], string | undefined> | undefined
      >(queryKey, (current) => {
        if (!current) {
          return {
            pages: [[message]],
            pageParams: [undefined],
          };
        }

        const alreadyExists = current.pages.some((page) =>
          page.some((item) => item.id === message.id),
        );
        if (alreadyExists) {
          return current;
        }

        const lastPageIndex = current.pages.length - 1;
        const nextPages = current.pages.map((page, index) =>
          index === lastPageIndex ? [...page, message] : page,
        );

        return {
          ...current,
          pages: nextPages,
        };
      });
    },
    [queryClient, queryKey],
  );

  return {
    ...query,
    appendMessage,
    hasMore: query.hasPreviousPage,
    loading: query.isLoading,
    loadingMore: query.isFetchingPreviousPage,
    loadMore: query.fetchPreviousPage,
    messages,
    reload: query.refetch,
  };
}
