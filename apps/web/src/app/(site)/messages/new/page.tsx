"use client";

import { Suspense, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { syncConversationPreview } from "@/features/messages/messageCache";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import { sendMessage } from "@/features/messages/services/messageApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { queryKeys } from "@/lib/queryKeys";

export default function NewMessagePage() {
  return (
    <Suspense fallback={null}>
      <NewMessageContent />
    </Suspense>
  );
}

function NewMessageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useSearchParams();
  const recipientId = params.get("to") || "";
  const { authBootstrapComplete, user } = useCurrentUser();
  const [content, setContent] = useState("");
  const sendMessageMutation = useMutation({
    mutationFn: (messageContent: string) =>
      sendMessage(recipientId, messageContent).then((result) => result.data),
    onSuccess: (message) => {
      const synced = syncConversationPreview(queryClient, user?.id, message, {
        otherUserId: recipientId,
        unreadCount: 0,
      });
      if (!synced && user) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.messages.conversations(user.id),
        });
      }
      router.push(`/messages/${message.conversationId}`);
    },
  });

  useEffect(() => {
    if (authBootstrapComplete && !user) {
      router.push("/login");
    }
  }, [authBootstrapComplete, router, user]);

  if (!authBootstrapComplete || !user) return null;

  const handleSend = async () => {
    if (!recipientId || !content.trim()) return;
    await sendMessageMutation.mutateAsync(content);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">发起私信</h1>
      <Textarea
        placeholder="输入消息..."
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <div className="flex justify-end">
        <Button
          onClick={handleSend}
          disabled={sendMessageMutation.isPending || !content.trim()}
        >
          {sendMessageMutation.isPending ? "发送中..." : "发送"}
        </Button>
      </div>
    </div>
  );
}
