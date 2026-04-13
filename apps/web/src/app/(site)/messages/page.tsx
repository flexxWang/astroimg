"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchConversations,
  markConversationRead,
  searchMessages,
  sendMessage,
} from "@/services/messageApi";
import { searchUsers } from "@/services/userSearchApi";
import { useUserStore } from "@/stores/userStore";
import { getSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useInfiniteMessages } from "@/hooks/useInfiniteMessages";

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
  const user = useUserStore((state) => state.user);
  const hydrated = useUserStore((state) => state.hydrated);
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [recipientOverride, setRecipientOverride] = useState<string | null>(
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

  useEffect(() => {
    const target = searchParams.get("to");
    if (target) {
      setRecipientOverride(target);
      setActiveId(null);
    }
  }, [searchParams]);

  const { data: convData, refetch: refetchConversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => fetchConversations(),
    enabled: Boolean(user),
  });

  const conversations = convData?.data ?? [];

  useEffect(() => {
    if (recipientOverride) return;
    if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [activeId, conversations, recipientOverride]);

  useEffect(() => {
    if (!recipientOverride || conversations.length === 0) return;
    const matched = conversations.find(
      (c) => c.otherUserId === recipientOverride,
    );
    if (!matched) return;
    if (activeId && matched.id !== activeId) {
      setRecipientOverride(null);
      return;
    }
    if (!activeId) {
      setActiveId(matched.id);
    }
  }, [activeId, conversations, recipientOverride]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [activeId, conversations],
  );

  const {
    messages,
    loadMore,
    hasMore,
    loadingMore,
    appendMessage,
    reload,
    loading,
  } = useInfiniteMessages(activeId);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    const handler = () => {
      refetchConversations();
      if (activeId) {
        reload();
        markConversationRead(activeId).catch(() => {});
      }
    };
    const readHandler = () => {
      refetchConversations();
    };
    socket.on("message:new", handler);
    socket.on("conversation:read", readHandler);
    return () => {
      socket.off("message:new", handler);
      socket.off("conversation:read", readHandler);
    };
  }, [activeId, refetchConversations, reload, user]);

  const messagesList = messages;

  useEffect(() => {
    if (!activeId || !user) return;
    markConversationRead(activeId)
      .then(() => refetchConversations())
      .catch(() => {});
  }, [activeId, refetchConversations, user]);

  useEffect(() => {
    if (debouncedMessageSearch.length > 0) return;
    const el = scrollRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceToBottom < 200) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [debouncedMessageSearch, messagesList.length]);

  useEffect(() => {
    if (!activeId) return;
    pendingScrollRef.current = true;
  }, [activeId]);

  useLayoutEffect(() => {
    if (!pendingScrollRef.current) return;
    if (loading) return;
    const el = scrollRef.current;
    if (!el) return;
    if (messagesList.length === 0) {
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
  }, [activeId, loading, messagesList.length]);

  const { data: searchMsgData } = useQuery({
    queryKey: ["messages-search", activeId, debouncedMessageSearch],
    queryFn: () => searchMessages(activeId!, debouncedMessageSearch),
    enabled: Boolean(activeId && debouncedMessageSearch.length > 0),
  });

  const { data: searchData } = useQuery({
    queryKey: ["user-search", debouncedSearch],
    queryFn: () => searchUsers(debouncedSearch),
    enabled: debouncedSearch.length > 0,
  });

  if (!hydrated || !user) return null;

  const handleSend = async () => {
    const recipientId = recipientOverride || activeConversation?.otherUserId;
    if (!recipientId || !content.trim()) return;
    try {
      const result = await sendMessage(recipientId, content);
      setContent("");
      setRecipientOverride(null);
      if (result.data.conversationId) {
        setActiveId(result.data.conversationId);
      }
      appendMessage(result.data);
      scrollToBottom();
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch {}
  };

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);
    return () => window.clearTimeout(handle);
  }, [search]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleStartChat = async (userId: string) => {
    setRecipientOverride(userId);
    setActiveId(null);
    setSearch("");
    setSearchOpen(false);
  };

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedMessageSearch(messageSearch.trim());
    }, 400);
    return () => window.clearTimeout(handle);
  }, [messageSearch]);

  const handleLoadMore = async () => {
    const el = scrollRef.current;
    if (!el) return;
    const prevHeight = el.scrollHeight;
    await loadMore();
    const newHeight = el.scrollHeight;
    el.scrollTop = newHeight - prevHeight;
  };

  return (
    <div className="h-[70vh] rounded-2xl border bg-white/80 shadow-sm">
      <div className="grid h-full grid-cols-[280px_1fr]">
        <aside className="border-r p-4">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">私信</h2>
            <Input
              placeholder="搜索用户"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSearchOpen(true);
              }}
            />
            {searchOpen && search.length > 0 ? (
              <div className="rounded-xl border bg-white">
                {(searchData?.data || []).map((u) => (
                  <button
                    key={u.id}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                    onClick={() => handleStartChat(u.id)}
                  >
                    <span>{u.username}</span>
                    <span className="text-xs text-muted-foreground">
                      发起聊天
                    </span>
                  </button>
                ))}
                {(searchData?.data || []).length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    没有匹配用户
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="mt-4 space-y-2">
            {conversations.map((c) => (
              <button
                key={c.id}
                className={`w-full rounded-xl px-3 py-2 text-left ${
                  c.id === activeId ? "bg-slate-100" : "hover:bg-slate-50"
                }`}
                onClick={() => {
                  setRecipientOverride(null);
                  setActiveId(c.id);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>{c.otherUsername}</span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        c.online ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                  </div>
                  {c.unreadCount ? (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] text-white">
                      {c.unreadCount}
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {c.lastMessage}
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
                onChange={(e) => setMessageSearch(e.target.value)}
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
                handleLoadMore();
              }
            }}
          >
            {loadingMore ? (
              <div className="text-center text-xs text-muted-foreground">
                加载中...
              </div>
            ) : null}
            {!hasMore && messagesList.length > 0 ? (
              <div className="text-center text-xs text-muted-foreground">
                没有更多了
              </div>
            ) : null}
            {(debouncedMessageSearch.length > 0
              ? (searchMsgData?.data ?? [])
              : messagesList
            ).map((msg, index, list) => {
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

              const currentDate = msg.createdAt
                ? formatDate(new Date(msg.createdAt))
                : "";
              const prev = list[index - 1];
              const prevDate = prev?.createdAt
                ? formatDate(new Date(prev.createdAt))
                : "";
              const showDivider = currentDate && currentDate !== prevDate;

              return (
                <div key={msg.id} className="space-y-2">
                  {showDivider ? (
                    <div className="w-full text-center text-xs text-muted-foreground my-2">
                      {currentDate}
                    </div>
                  ) : null}
                  <div
                    className={`flex ${
                      msg.senderId === user.id ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                        msg.senderId === user.id
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-900"
                      }`}
                    >
                      {msg.content}
                      {msg.senderId === user.id ? (
                        <div className="mt-1 text-[10px] text-white/70 text-right">
                          {msg.read ? "已读" : "未读"}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
            {(
              debouncedMessageSearch.length > 0
                ? (searchMsgData?.data ?? []).length === 0
                : messagesList.length === 0
            ) ? (
              <div className="text-sm text-muted-foreground">暂无消息</div>
            ) : null}
            <div ref={bottomRef} />
          </div>
          <div className="border-t p-4">
            <Textarea
              placeholder="输入消息..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="mt-2 flex justify-end">
              <Button onClick={handleSend} disabled={!content.trim()}>
                发送
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
