import { apiFetch } from "@/lib/apiClient";

export interface ConversationItem {
  id: string;
  otherUserId: string;
  otherUsername: string;
  lastMessage: string;
  updatedAt?: string;
  unreadCount?: number;
  online?: boolean;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  read: boolean;
  createdAt?: string;
}

export function fetchConversations() {
  return apiFetch<ConversationItem[]>("/messages/conversations", {
    errorToast: {
      title: "加载会话失败",
      fallback: "加载会话失败，请稍后再试。",
    },
  });
}

export function fetchMessages(conversationId: string, cursor?: string) {
  return apiFetch<MessageItem[]>(
    `/messages/conversations/${conversationId}${
      cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""
    }`,
    {
      errorToast: {
        title: "加载消息失败",
        fallback: "加载消息失败，请稍后再试。",
      },
    },
  );
}

export function searchMessages(conversationId: string, keyword: string) {
  return apiFetch<MessageItem[]>(
    `/messages/conversations/${conversationId}/search?keyword=${encodeURIComponent(keyword)}`,
    {
      errorToast: {
        title: "搜索消息失败",
        fallback: "搜索消息失败，请稍后再试。",
      },
    },
  );
}

export function sendMessage(recipientId: string, content: string) {
  return apiFetch<MessageItem>("/messages/send", {
    method: "POST",
    body: JSON.stringify({ recipientId, content }),
    errorToast: {
      title: "发送失败",
      fallback: "发送失败，请稍后再试。",
    },
  });
}

export function markConversationRead(conversationId: string) {
  return apiFetch<null>("/messages/read", {
    method: "POST",
    body: JSON.stringify({ conversationId }),
    errorToast: false,
  });
}
