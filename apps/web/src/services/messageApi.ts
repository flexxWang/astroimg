import { apiFetch } from "@/services/api";

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
  return apiFetch<ConversationItem[]>("/messages/conversations", {});
}

export function fetchMessages(conversationId: string, cursor?: string) {
  return apiFetch<MessageItem[]>(
    `/messages/conversations/${conversationId}${
      cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""
    }`,
    {},
  );
}

export function searchMessages(conversationId: string, keyword: string) {
  return apiFetch<MessageItem[]>(
    `/messages/conversations/${conversationId}/search?keyword=${encodeURIComponent(keyword)}`,
    {},
  );
}

export function sendMessage(recipientId: string, content: string) {
  return apiFetch<MessageItem>("/messages/send", {
    method: "POST",
    body: JSON.stringify({ recipientId, content }),
  });
}

export function markConversationRead(conversationId: string) {
  return apiFetch<null>("/messages/read", {
    method: "POST",
    body: JSON.stringify({ conversationId }),
  });
}
