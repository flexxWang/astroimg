import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { ConversationItem, MessageItem } from "@/features/messages/services/messageApi";
import { queryKeys } from "@/lib/queryKeys";

export function appendMessageToThreadCache(
  queryClient: QueryClient,
  conversationId: string,
  message: MessageItem,
) {
  queryClient.setQueryData<
    InfiniteData<MessageItem[], string | undefined> | undefined
  >(queryKeys.messages.thread(conversationId), (current) => {
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
    return {
      ...current,
      pages: current.pages.map((page, index) =>
        index === lastPageIndex ? [...page, message] : page,
      ),
    };
  });
}

export function clearConversationUnread(
  queryClient: QueryClient,
  userId: string | undefined,
  conversationId: string,
) {
  queryClient.setQueryData<ConversationItem[] | undefined>(
    queryKeys.messages.conversations(userId),
    (current) =>
      current?.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, unreadCount: 0 }
          : conversation,
      ),
  );
}

export function setPresenceInConversationList(
  queryClient: QueryClient,
  userId: string | undefined,
  targetUserId: string,
  online: boolean,
) {
  queryClient.setQueryData<ConversationItem[] | undefined>(
    queryKeys.messages.conversations(userId),
    (current) =>
      current?.map((conversation) =>
        conversation.otherUserId === targetUserId
          ? { ...conversation, online }
          : conversation,
      ),
  );
}
