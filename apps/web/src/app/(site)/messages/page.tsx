"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import ImageViewer from "@/shared/components/ImageViewer";
import { MessageComposer } from "@/features/messages/components/MessageComposer";
import { MessageThread } from "@/features/messages/components/MessageThread";
import { MessagesSidebar } from "@/features/messages/components/MessagesSidebar";
import { useConversationMessages } from "@/features/messages/hooks/useConversationMessages";
import { useMessageThreadScroll } from "@/features/messages/hooks/useMessageThreadScroll";
import { buildMessageContent } from "@/features/messages/messageContent";
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
  const searchConversationId =
    searchParams.get("conversationId") ?? searchParams.get("id");
  const searchRecipientId = searchParams.get("to");
  const { authBootstrapComplete, user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draftRecipientOverride, setDraftRecipientOverride] = useState<
    string | null
  >(null);
  const [search, setSearch] = useState("");
  const [content, setContent] = useState("");
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [debouncedMessageSearch, setDebouncedMessageSearch] = useState("");

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
    if (searchConversationId) {
      return searchConversationId;
    }

    if (recipientOverride) {
      return (
        conversations.find(
          (conversation) => conversation.otherUserId === recipientOverride,
        )?.id ?? null
      );
    }

    return activeId;
  }, [activeId, conversations, recipientOverride, searchConversationId]);

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === selectedConversationId,
      ) ?? null,
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

  const {
    handleScroll,
    isInitializing: threadInitializing,
    resetThreadScroll,
    scrollRef,
    scrollToBottom,
  } = useMessageThreadScroll({
    conversationId: selectedConversationId,
    hasMore,
    loadMore,
    loading,
    messagesLength: messages.length,
    searchActive: debouncedMessageSearch.length > 0,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({
      body,
      recipientId,
    }: {
      body: string;
      clearContent: boolean;
      recipientId: string;
    }) => sendMessage(recipientId, body).then((result) => result.data),
    onSuccess: (message, variables) => {
      if (variables.clearContent) {
        setContent("");
      }
      setDraftRecipientOverride(null);

      if (message.conversationId) {
        resetThreadScroll(message.conversationId);
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

  const { data: searchResults = [] } = useQuery({
    queryKey: queryKeys.messages.search(
      selectedConversationId,
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

  const handleStartChat = (userId: string) => {
    setDraftRecipientOverride(userId);
    setActiveId(null);
    setSearch("");
    setSearchOpen(false);
  };

  const handleSelectConversation = (conversationId: string) => {
    if (!recipientOverride && conversationId === selectedConversationId) {
      return;
    }

    resetThreadScroll(conversationId);
    queryClient.removeQueries({
      queryKey: queryKeys.messages.thread(conversationId),
      exact: true,
    });
    setDraftRecipientOverride(null);
    setActiveId(conversationId);
  };

  const handleSelectImages = (files: File[]) => {
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

  const visibleMessages =
    debouncedMessageSearch.length > 0 ? searchResults : messages;
  const canCompose = Boolean(recipientOverride || activeConversation);
  const emptyState = !selectedConversationId
    ? {
        title: "还没有打开会话",
        description: "从左侧选择一个会话，或搜索用户发起新的私信。",
      }
    : debouncedMessageSearch.length > 0
      ? {
          title: "没有找到消息",
          description: "换个关键词试试，或清空搜索返回完整会话。",
        }
      : {
          title: "暂无消息",
          description: "发送第一条消息，图片和表情也可以直接从输入框上方添加。",
        };

  return (
    <div className="h-[calc(100vh-9rem)] min-h-[620px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid h-full grid-cols-[300px_1fr]">
        <MessagesSidebar
          conversations={conversations}
          onSearchChange={(value) => {
            setSearch(value);
            setSearchOpen(true);
          }}
          onSelectConversation={handleSelectConversation}
          onStartChat={handleStartChat}
          search={search}
          searchOpen={searchOpen}
          searchedUsers={searchedUsers}
          selectedConversationId={selectedConversationId}
        />

        <section className="flex h-full min-h-0 flex-col bg-white">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
            <div>
              <div className="text-sm font-semibold text-slate-950">
                {activeConversation
                  ? activeConversation.otherUsername
                  : recipientOverride
                    ? "新会话"
                    : "消息"}
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                {activeConversation
                  ? activeConversation.online
                    ? "在线"
                    : "离线"
                  : recipientOverride
                    ? "发送第一条消息开始会话"
                    : "选择会话后查看消息"}
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

          <MessageThread
            key={selectedConversationId ?? "empty-thread"}
            currentUserId={user.id}
            currentUsername={user.username}
            emptyState={emptyState}
            hasMore={hasMore}
            initializing={threadInitializing}
            loadingMore={loadingMore}
            messages={visibleMessages}
            onPreviewImages={(images, index) => {
              setViewerImages(images);
              setViewerIndex(index);
            }}
            onScroll={handleScroll}
            otherUsername={activeConversation?.otherUsername}
            scrollRef={scrollRef}
          />

          {canCompose ? (
            <MessageComposer
              content={content}
              onChange={setContent}
              onSelectImages={handleSelectImages}
              onSend={() => void handleSend()}
              sending={sendMessageMutation.isPending}
            />
          ) : null}
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
