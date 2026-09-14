"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  markConversationRead,
  sendMessage,
} from "@/features/messages/services/messageApi";
import { useConversationMessages } from "@/features/messages/hooks/useConversationMessages";
import {
  appendMessageToThreadCache,
  syncConversationPreview,
} from "@/features/messages/messageCache";
import { parseMessageContent } from "@/features/messages/messageContent";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { queryKeys } from "@/lib/queryKeys";

export default function MessageThreadPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { authBootstrapComplete, user } = useCurrentUser();
  const [content, setContent] = useState("");
  const conversationId = params.id as string;

  useEffect(() => {
    if (authBootstrapComplete && !user) {
      router.push("/login");
    }
  }, [authBootstrapComplete, router, user]);

  const { loading, messages } = useConversationMessages(conversationId);
  const sendMessageMutation = useMutation({
    mutationFn: (recipientId: string) =>
      sendMessage(recipientId, content).then((result) => result.data),
    onSuccess: (message) => {
      setContent("");
      appendMessageToThreadCache(queryClient, message.conversationId, message);
      const synced = syncConversationPreview(queryClient, user?.id, message, {
        otherUserId: recipientId ?? undefined,
        unreadCount: 0,
      });
      if (!synced && user) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.messages.conversations(user.id),
        });
      }
    },
  });

  useEffect(() => {
    if (user) {
      markConversationRead(conversationId).catch(() => {});
    }
  }, [conversationId, user]);

  const firstMessage = messages[0];
  const recipientId =
    firstMessage && user
      ? firstMessage.senderId === user.id
        ? firstMessage.recipientId
        : firstMessage.senderId
      : null;

  if (!authBootstrapComplete || !user) return null;

  const handleSend = async () => {
    if (!recipientId || !content.trim()) return;
    await sendMessageMutation.mutateAsync(recipientId);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">会话</h1>
      {loading ? (
        <div className="text-sm text-muted-foreground">加载中...</div>
      ) : (
        <div className="space-y-3 rounded-2xl border bg-white/80 p-4">
          {messages.map((msg) => {
            const parsed = parseMessageContent(msg.content);
            return (
              <div
                key={msg.id}
                className={`flex ${
                  msg.senderId === user.id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] space-y-2 rounded-2xl px-4 py-2 text-sm ${
                    msg.senderId === user.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-900"
                  }`}
                >
                  {parsed.text ? (
                    <div className="whitespace-pre-wrap break-words">
                      {parsed.text}
                    </div>
                  ) : null}
                  {parsed.images.map((image) => (
                    <a
                      key={image.url}
                      href={image.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-lg bg-black/5"
                    >
                      <Image
                        src={image.url}
                        alt={image.name || "消息图片"}
                        width={288}
                        height={288}
                        unoptimized
                        className="max-h-72 w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        <Textarea
          placeholder="输入消息..."
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSend}
            disabled={!content.trim() || sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending ? "发送中..." : "发送"}
          </Button>
        </div>
      </div>
    </div>
  );
}
