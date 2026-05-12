"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useConversationMessages } from "@/features/messages/hooks/useConversationMessages";
import {
  appendMessageToThreadCache,
  clearConversationUnread,
  setPresenceInConversationList,
} from "@/features/messages/messageCache";
import {
  type MessageItem,
  fetchConversations,
  markConversationRead,
  searchMessages,
  sendMessage,
} from "@/features/messages/services/messageApi";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import { searchUsers } from "@/features/users/services/userSearchApi";
import { queryKeys } from "@/lib/queryKeys";
import { getSocket } from "@/lib/socket";

type PresenceUpdate = {
  userId: string;
  online: boolean;
};

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesPageContent />
    </Suspense>
  );
}

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchRecipientId = searchParams.get("to");
  const { hydrated, user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draftRecipientOverride, setDraftRecipientOverride] = useState<string | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [content, setContent] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [debouncedMessageSearch, setDebouncedMessageSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollRef = useRef(false);

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight - el.clientHeight;
      });
    });
  };

  useEffect(() => {
    if (hydrated && !user) {
      router.push("/login");
    }
  }, [hydrated, router, user]);

  const conversationsQueryKey = queryKeys.messages.conversations(user?.id);
  const { data: conversations = [] } = useQuery({
    queryKey: conversationsQueryKey,
    queryFn: () => fetchConversations().then((result) => result.data),
    enabled: Boolean(user),
  });

  const recipientOverride = draftRecipientOverride ?? searchRecipientId;
  const selectedConversationId = useMemo(() => {
    if (recipientOverride) {
      return (
        conversations.find((conversation) => conversation.otherUserId === recipientOverride)
          ?.id ?? null
      );
    }

    return activeId ?? conversations[0]?.id ?? null;
  }, [activeId, conversations, recipientOverride]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const {
    appendMessage,
    hasMore,
    loading,
    loadingMore,
    loadMore,
    messages,
  } = useConversationMessages(selectedConversationId);

  const sendMessageMutation = useMutation({
    mutationFn: ({ content, recipientId }: { content: string; recipientId: string }) =>
      sendMessage(recipientId, content).then((result) => result.data),
    onSuccess: (message) => {
      setContent("");
      setDraftRecipientOverride(null);

      if (message.conversationId) {
        setActiveId(message.conversationId);
        appendMessageToThreadCache(queryClient, message.conversationId, message);
      } else if (selectedConversationId) {
        appendMessage(message);
      }

      scrollToBottom();
      queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
    },
  });

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    const refreshHandler = () => {
      queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
    };
    const presenceHandler = (payload: PresenceUpdate) => {
      setPresenceInConversationList(
        queryClient,
        user.id,
        payload.userId,
        payload.online,
      );
    };
    const messageHandler = (message: MessageItem) => {
      if (message.senderId === user.id) {
        return;
      }

      queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
      if (selectedConversationId === message.conversationId) {
        appendMessageToThreadCache(queryClient, message.conversationId, message);
        markConversationRead(selectedConversationId)
          .then(() =>
            clearConversationUnread(queryClient, user.id, selectedConversationId),
          )
          .catch(() => {});
      }
    };
    const readHandler = (payload: { conversationId?: string }) => {
      if (payload.conversationId) {
        clearConversationUnread(queryClient, user.id, payload.conversationId);
      }
    };

    socket.on("connect", refreshHandler);
    socket.on("message:new", messageHandler);
    socket.on("conversation:read", readHandler);
    socket.on("presence:update", presenceHandler);

    return () => {
      socket.off("connect", refreshHandler);
      socket.off("message:new", messageHandler);
      socket.off("conversation:read", readHandler);
      socket.off("presence:update", presenceHandler);
    };
  }, [conversationsQueryKey, queryClient, selectedConversationId, user]);

  useEffect(() => {
    if (!selectedConversationId || !user) return;
    markConversationRead(selectedConversationId)
      .then(() =>
        clearConversationUnread(queryClient, user.id, selectedConversationId),
      )
      .catch(() => {});
  }, [queryClient, selectedConversationId, user]);

  useEffect(() => {
    if (debouncedMessageSearch.length > 0) return;
    const el = scrollRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceToBottom < 200) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [debouncedMessageSearch, messages.length]);

  useEffect(() => {
    if (!selectedConversationId) return;
    pendingScrollRef.current = true;
  }, [selectedConversationId]);

  useLayoutEffect(() => {
    if (!pendingScrollRef.current || loading) return;
    const el = scrollRef.current;
    if (!el) return;
    if (messages.length === 0) {
      el.scrollTop = 0;
      pendingScrollRef.current = false;
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight - el.clientHeight;
        pendingScrollRef.current = false;
      });
    });
  }, [loading, messages.length, selectedConversationId]);

  const { data: searchResults = [] } = useQuery({
    queryKey: queryKeys.messages.search(
      selectedConversationId ?? "pending",
      debouncedMessageSearch,
    ),
    queryFn: () =>
      searchMessages(selectedConversationId!, debouncedMessageSearch).then(
        (result) => result.data,
      ),
    enabled: Boolean(selectedConversationId && debouncedMessageSearch.length > 0),
  });

  const { data: searchedUsers = [] } = useQuery({
    queryKey: queryKeys.users.search(debouncedSearch),
    queryFn: () => searchUsers(debouncedSearch).then((result) => result.data),
    enabled: debouncedSearch.length > 0,
  });

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);
    return () => window.clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedMessageSearch(messageSearch.trim());
    }, 400);
    return () => window.clearTimeout(handle);
  }, [messageSearch]);

  if (!hydrated || !user) {
    return null;
  }

  const handleSend = async () => {
    const recipientId = recipientOverride || activeConversation?.otherUserId;
    if (!recipientId || !content.trim()) return;
    await sendMessageMutation.mutateAsync({ recipientId, content });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const handleStartChat = (userId: string) => {
    setDraftRecipientOverride(userId);
    setActiveId(null);
    setSearch("");
    setSearchOpen(false);
  };

  const handleLoadMore = async () => {
    const el = scrollRef.current;
    if (!el) return;
    const previousHeight = el.scrollHeight;
    await loadMore();
    const nextHeight = el.scrollHeight;
    el.scrollTop = nextHeight - previousHeight;
  };

  const visibleMessages = debouncedMessageSearch.length > 0 ? searchResults : messages;

  return (
    <div className="h-[70vh] rounded-2xl border bg-white/80 shadow-sm">
      <div className="grid h-full grid-cols-[280px_1fr]">
        <aside className="border-r p-4">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">私信</h2>
            <Input
              placeholder="搜索用户"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSearchOpen(true);
              }}
            />
            {searchOpen && search.length > 0 ? (
              <div className="rounded-xl border bg-white">
                {searchedUsers.map((searchUser) => (
                  <button
                    key={searchUser.id}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                    onClick={() => handleStartChat(searchUser.id)}
                  >
                    <span>{searchUser.username}</span>
                    <span className="text-xs text-muted-foreground">发起聊天</span>
                  </button>
                ))}
                {searchedUsers.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    没有匹配用户
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-4 space-y-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                className={`w-full rounded-xl px-3 py-2 text-left ${
                  conversation.id === selectedConversationId
                    ? "bg-slate-100"
                    : "hover:bg-slate-50"
                }`}
                onClick={() => {
                  setDraftRecipientOverride(null);
                  setActiveId(conversation.id);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>{conversation.otherUsername}</span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        conversation.online ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                  </div>
                  {conversation.unreadCount ? (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] text-white">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {conversation.lastMessage}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex h-full min-h-0 flex-col">
          <div className="border-b px-4 py-3 text-sm font-semibold flex items-center justify-between">
            {activeConversation
              ? activeConversation.otherUsername
              : recipientOverride
                ? "新会话"
                : "选择会话"}
            {activeConversation ? (
              <Input
                placeholder="搜索消息"
                value={messageSearch}
                onChange={(event) => setMessageSearch(event.target.value)}
                className="max-w-[200px]"
              />
            ) : null}
          </div>

          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3"
            onScroll={() => {
              const el = scrollRef.current;
              if (!el || debouncedMessageSearch.length > 0) return;
              if (el.scrollTop === 0 && hasMore) {
                void handleLoadMore();
              }
            }}
          >
            {loadingMore ? (
              <div className="text-center text-xs text-muted-foreground">加载中...</div>
            ) : null}
            {!hasMore && messages.length > 0 ? (
              <div className="text-center text-xs text-muted-foreground">没有更多了</div>
            ) : null}

            {visibleMessages.map((message, index, list) => {
              const formatDate = (date: Date) => {
                const now = new Date();
                const diffMs = now.getTime() - date.getTime();
                const diffMinutes = Math.floor(diffMs / (60 * 1000));
                const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

                if (diffDays === 0) {
                  if (diffMinutes < 5) return "刚刚";
                  return date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                }
                if (diffDays === 1) return "昨天";
                if (diffDays === 2) return "前天";
                return date.toLocaleDateString();
              };

              const currentDate = message.createdAt
                ? formatDate(new Date(message.createdAt))
                : "";
              const prev = list[index - 1];
              const prevDate = prev?.createdAt
                ? formatDate(new Date(prev.createdAt))
                : "";
              const showDivider = currentDate && currentDate !== prevDate;

              return (
                <div key={message.id} className="space-y-2">
                  {showDivider ? (
                    <div className="w-full text-center text-xs text-muted-foreground my-2">
                      {currentDate}
                    </div>
                  ) : null}
                  <div
                    className={`flex ${
                      message.senderId === user.id ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                        message.senderId === user.id
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-900"
                      }`}
                    >
                      {message.content}
                      {message.senderId === user.id ? (
                        <div className="mt-1 text-[10px] text-white/70 text-right">
                          {message.read ? "已读" : "未读"}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}

            {(debouncedMessageSearch.length > 0
              ? searchResults.length === 0
              : messages.length === 0) ? (
              <div className="text-sm text-muted-foreground">暂无消息</div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <div className="border-t p-4">
            <Textarea
              placeholder="输入消息..."
              value={content}
              onChange={(event) => setContent(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="mt-2 flex justify-end">
              <Button
                onClick={() => void handleSend()}
                disabled={!content.trim() || sendMessageMutation.isPending}
              >
                {sendMessageMutation.isPending ? "发送中..." : "发送"}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
