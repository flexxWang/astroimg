"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Send, Smile } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ImageViewer from "@/shared/components/ImageViewer";
import { useConversationMessages } from "@/features/messages/hooks/useConversationMessages";
import {
  buildMessageContent,
  formatMessagePreview,
  parseMessageContent,
} from "@/features/messages/messageContent";
import {
  appendMessageToThreadCache,
  clearConversationUnread,
  setPresenceInConversationList,
  syncConversationPreview,
} from "@/features/messages/messageCache";
import {
  type MessageItem,
  fetchConversations,
  markConversationRead,
  searchMessages,
  sendMessage,
} from "@/features/messages/services/messageApi";
import { signUpload, uploadFile } from "@/features/uploads/services/uploadApi";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import { searchUsers } from "@/features/users/services/userSearchApi";
import { queryKeys } from "@/lib/queryKeys";
import { getSocket } from "@/lib/socket";

type PresenceUpdate = {
  userId: string;
  online: boolean;
};

const QUICK_EMOJIS = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😂",
  "🤣",
  "😊",
  "😉",
  "😍",
  "😘",
  "😎",
  "🤔",
  "😅",
  "😭",
  "😤",
  "🥳",
  "🤩",
  "😇",
  "👍",
  "👎",
  "👏",
  "🙏",
  "💪",
  "🤝",
  "🙌",
  "👌",
  "🔥",
  "✨",
  "💫",
  "🌙",
  "⭐",
  "🌌",
  "☄️",
  "🪐",
  "🚀",
  "📷",
  "🔭",
  "🌠",
  "🌞",
  "🌝",
  "☁️",
  "⚡",
  "💡",
  "✅",
  "❌",
  "❗",
  "❓",
  "❤️",
  "💙",
  "💜",
  "💛",
  "🎉",
  "🎊",
  "🏆",
  "📌",
  "📎",
  "💬",
];

function readImageSize(file: File) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: 288, height: 216 });
    };
    image.src = objectUrl;
  });
}

function getMessageImageSize(width?: number, height?: number) {
  const naturalWidth = width && width > 0 ? width : 288;
  const naturalHeight = height && height > 0 ? height : 216;
  const maxWidth = 288;
  const maxHeight = 288;
  const scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight, 1);

  return {
    width: Math.max(1, Math.round(naturalWidth * scale)),
    height: Math.max(1, Math.round(naturalHeight * scale)),
  };
}

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
  const { authBootstrapComplete, user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draftRecipientOverride, setDraftRecipientOverride] = useState<string | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [content, setContent] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [debouncedMessageSearch, setDebouncedMessageSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
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
    if (authBootstrapComplete && !user) {
      router.push("/login");
    }
  }, [authBootstrapComplete, router, user]);

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
    mutationFn: async ({
      body,
      recipientId,
    }: {
      body: string;
      clearContent: boolean;
      recipientId: string;
    }) => {
      return sendMessage(recipientId, body).then((result) => result.data);
    },
    onSuccess: (message, variables) => {
      if (variables.clearContent) {
        setContent("");
      }
      setEmojiOpen(false);
      setDraftRecipientOverride(null);

      if (message.conversationId) {
        setActiveId(message.conversationId);
        appendMessageToThreadCache(queryClient, message.conversationId, message);
      } else if (selectedConversationId) {
        appendMessage(message);
      }

      scrollToBottom();
      const synced = syncConversationPreview(queryClient, user?.id, message, {
        otherUserId: variables.recipientId,
        otherUsername: activeConversation?.otherUsername,
        unreadCount: 0,
      });
      if (!synced && user) {
        queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
      }
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
    queryKey: queryKeys.messages.search(selectedConversationId, debouncedMessageSearch),
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

  useEffect(() => {
    if (!emojiOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        emojiPickerRef.current?.contains(target)
      ) {
        return;
      }
      setEmojiOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEmojiOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [emojiOpen]);

  if (!authBootstrapComplete || !user) {
    return null;
  }

  const handleSend = async () => {
    const recipientId = recipientOverride || activeConversation?.otherUserId;
    if (!recipientId || !content.trim()) return;
    await sendMessageMutation.mutateAsync({
      recipientId,
      body: buildMessageContent(content),
      clearContent: true,
    });
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

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    event.target.value = "";
    if (files.length === 0) return;

    const recipientId = recipientOverride || activeConversation?.otherUserId;
    if (!recipientId) return;

    void (async () => {
      const uploadedImages = await Promise.all(
        files.map(async (file) => {
          const size = await readImageSize(file);
          const signed = await signUpload(file.name, file.type, file.size);
          await uploadFile(signed.data, file);
          return {
            url: signed.data.fileUrl,
            name: file.name,
            width: size.width,
            height: size.height,
          };
        }),
      );

      await sendMessageMutation.mutateAsync({
        recipientId,
        body: buildMessageContent("", uploadedImages),
        clearContent: false,
      });
    })();
  };

  const appendEmoji = (emoji: string) => {
    setContent((current) => `${current}${emoji}`);
    setEmojiOpen(false);
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
    <div className="h-[calc(100vh-9rem)] min-h-[620px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid h-full grid-cols-[300px_1fr]">
        <aside className="flex min-h-0 flex-col border-r border-slate-200 bg-slate-50/80">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-950">私信</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {conversations.length > 0
                ? `${conversations.length} 个会话`
                : "还没有会话"}
            </p>
          </div>

          <div className="relative border-b border-slate-200 bg-white/70 px-4 py-3">
            <Input
              placeholder="搜索用户并发起聊天"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSearchOpen(true);
              }}
              className="h-9 rounded-lg border-slate-200 bg-white text-sm shadow-none"
            />
            {searchOpen && search.length > 0 ? (
              <div className="absolute left-4 right-4 top-[52px] z-20 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                {searchedUsers.map((searchUser) => (
                  <button
                    key={searchUser.id}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition hover:bg-slate-50"
                    onClick={() => handleStartChat(searchUser.id)}
                  >
                    <span className="font-medium text-slate-800">
                      {searchUser.username}
                    </span>
                    <span className="text-xs text-slate-500">发起聊天</span>
                  </button>
                ))}
                {searchedUsers.length === 0 ? (
                  <div className="px-3 py-2.5 text-xs text-slate-500">
                    没有匹配用户
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto py-2">
            {conversations.map((conversation) => {
              const selected = conversation.id === selectedConversationId;
              return (
                <button
                  key={conversation.id}
                  className={`group relative flex w-full gap-3 px-4 py-3 text-left transition ${
                    selected
                      ? "bg-white text-slate-950 shadow-[inset_3px_0_0_#0f172a]"
                      : "text-slate-700 hover:bg-white/70"
                  }`}
                  onClick={() => {
                    setDraftRecipientOverride(null);
                    setActiveId(conversation.id);
                  }}
                >
                  <span className="relative mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                    {conversation.otherUsername.slice(0, 1).toUpperCase()}
                    <span
                      className={`absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-white ${
                        conversation.online ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {conversation.otherUsername}
                      </span>
                      {conversation.unreadCount ? (
                        <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-medium text-white">
                          {conversation.unreadCount}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      {formatMessagePreview(conversation.lastMessage) || "还没有消息"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex h-full min-h-0 flex-col bg-white">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
            <div>
              <div className="text-sm font-semibold text-slate-950">
                {activeConversation
                  ? activeConversation.otherUsername
                  : recipientOverride
                    ? "新会话"
                    : "选择会话"}
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                {activeConversation
                  ? activeConversation.online
                    ? "在线"
                    : "离线"
                  : "从左侧选择一个会话开始"}
              </div>
            </div>
            {activeConversation ? (
              <Input
                placeholder="搜索消息"
                value={messageSearch}
                onChange={(event) => setMessageSearch(event.target.value)}
                className="h-9 max-w-[220px] rounded-lg border-slate-200 bg-slate-50 text-sm shadow-none"
              />
            ) : null}
          </div>

          <div
            ref={scrollRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/50 px-6 py-5"
            onScroll={() => {
              const el = scrollRef.current;
              if (!el || debouncedMessageSearch.length > 0) return;
              if (el.scrollTop === 0 && hasMore) {
                void handleLoadMore();
              }
            }}
          >
            {loadingMore ? (
              <div className="text-center text-xs text-slate-500">加载中...</div>
            ) : null}
            {!hasMore && messages.length > 0 ? (
              <div className="text-center text-xs text-slate-400">没有更多了</div>
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
              const isMine = message.senderId === user.id;
              const avatarName = isMine
                ? user.username || user.id
                : activeConversation?.otherUsername || "用户";
              const parsedContent = parseMessageContent(message.content);

              return (
                <div key={message.id} className="space-y-2">
                  {showDivider ? (
                    <div className="my-3 flex w-full justify-center">
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-400 shadow-sm ring-1 ring-slate-200">
                        {currentDate}
                      </span>
                    </div>
                  ) : null}
                  <div
                    className={`flex items-start gap-2 ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isMine ? (
                      <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600 ring-1 ring-indigo-100"
                        aria-label={avatarName}
                      >
                        {avatarName.slice(0, 1).toUpperCase()}
                      </div>
                    ) : null}
                    <div
                      className={`flex max-w-[70%] flex-col gap-1 ${
                        isMine ? "items-end" : "items-start"
                      }`}
                    >
                      {parsedContent.text ? (
                        <div
                          className={`w-full rounded-lg px-3 py-2.5 text-sm leading-6 shadow-sm ${
                            isMine
                              ? "rounded-tr-none bg-[#2563eb] text-white"
                              : "rounded-tl-none bg-white text-slate-900 ring-1 ring-indigo-100"
                          }`}
                        >
                          <div className="whitespace-pre-wrap break-words px-1">
                            {parsedContent.text}
                          </div>
                        </div>
                      ) : null}
                      {parsedContent.images.length > 0 ? (
                        <div className="grid max-w-72 grid-cols-1 gap-2">
                          {parsedContent.images.map((image) => {
                            const imageSize = getMessageImageSize(
                              image.width,
                              image.height,
                            );
                            return (
                              <button
                                key={image.url}
                                type="button"
                                onClick={() => {
                                  setViewerImages(
                                    parsedContent.images.map((item) => item.url),
                                  );
                                  setViewerIndex(
                                    parsedContent.images.findIndex(
                                      (item) => item.url === image.url,
                                    ),
                                  );
                                }}
                                className="relative block overflow-hidden rounded-lg bg-slate-100 shadow-sm ring-1 ring-slate-200 transition hover:opacity-90"
                                style={imageSize}
                              >
                                <Image
                                  src={image.url}
                                  alt={image.name || "消息图片"}
                                  fill
                                  sizes={`${imageSize.width}px`}
                                  unoptimized
                                  className="object-cover"
                                />
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                      {isMine ? (
                        <div className="pr-1 text-[10px] text-slate-400">
                          {message.read ? "已读" : "未读"}
                        </div>
                      ) : null}
                    </div>
                    {isMine ? (
                      <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 ring-1 ring-blue-200"
                        aria-label={avatarName}
                      >
                        {avatarName.slice(0, 1).toUpperCase()}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {(debouncedMessageSearch.length > 0
              ? searchResults.length === 0
              : messages.length === 0) ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                暂无消息
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white p-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 transition focus-within:border-slate-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-200">
              <div className="flex items-center px-1 pb-2">
                <div ref={emojiPickerRef} className="relative flex items-center gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEmojiOpen((open) => !open)}
                    disabled={sendMessageMutation.isPending}
                    title="添加表情"
                  >
                    <Smile className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setEmojiOpen(false);
                      fileInputRef.current?.click();
                    }}
                    disabled={sendMessageMutation.isPending}
                    title="发送图片"
                  >
                    <ImagePlus className="size-4" />
                  </Button>
                  {emojiOpen ? (
                    <div className="absolute bottom-9 left-0 z-20 grid max-h-64 w-72 grid-cols-8 gap-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => appendEmoji(emoji)}
                          className="flex size-8 items-center justify-center rounded-lg text-lg transition hover:bg-slate-100"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <Textarea
                placeholder="输入消息..."
                value={content}
                onChange={(event) => setContent(event.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-20 resize-none border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
              />
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="text-xs text-slate-400">
                  Enter 发送，Shift + Enter 换行
                </span>
                <Button
                  onClick={() => void handleSend()}
                  disabled={!content.trim() || sendMessageMutation.isPending}
                  className="h-9 rounded-xl px-4"
                >
                  {sendMessageMutation.isPending ? (
                    "发送中..."
                  ) : (
                    <>
                      <Send className="size-4" />
                      发送
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
      <ImageViewer
        open={viewerImages.length > 0}
        images={viewerImages}
        index={viewerIndex}
        onClose={() => setViewerImages([])}
        onChange={setViewerIndex}
      />
    </div>
  );
}
