"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  fetchMessages,
  markConversationRead,
  sendMessage,
} from "@/features/messages/services/messageApi";
import { useUserStore } from "@/stores/userStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function MessageThreadPage() {
  const params = useParams();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const hydrated = useUserStore((state) => state.hydrated);
  const [content, setContent] = useState("");
  const conversationId = params.id as string;

  useEffect(() => {
    if (hydrated && !user) {
      router.push("/login");
    }
  }, [hydrated, router, user]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => fetchMessages(conversationId),
    enabled: Boolean(user),
  });

  const messages = useMemo(() => data?.data ?? [], [data]);

  useEffect(() => {
    if (user) {
      markConversationRead(conversationId).catch(() => {});
    }
  }, [conversationId, user]);

  const recipientId = useMemo(() => {
    const first = messages[0];
    if (!first || !user) return null;
    return first.senderId === user.id ? first.recipientId : first.senderId;
  }, [messages, user]);

  if (!hydrated || !user) return null;

  const handleSend = async () => {
    if (!recipientId || !content.trim()) return;
    await sendMessage(recipientId, content);
    setContent("");
    await refetch();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">会话</h1>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">加载中...</div>
      ) : (
        <div className="space-y-3 rounded-2xl border bg-white/80 p-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
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
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <Textarea
          placeholder="输入消息..."
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <div className="flex justify-end">
          <Button onClick={handleSend} disabled={!content.trim()}>
            发送
          </Button>
        </div>
      </div>
    </div>
  );
}
