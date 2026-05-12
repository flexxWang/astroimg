"use client";

import { Suspense, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import { sendMessage } from "@/features/messages/services/messageApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function NewMessagePage() {
  return (
    <Suspense fallback={null}>
      <NewMessageContent />
    </Suspense>
  );
}

function NewMessageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const recipientId = params.get("to") || "";
  const { hydrated, user } = useCurrentUser();
  const [content, setContent] = useState("");
  const sendMessageMutation = useMutation({
    mutationFn: (messageContent: string) =>
      sendMessage(recipientId, messageContent).then((result) => result.data),
    onSuccess: (message) => {
      router.push(`/messages/${message.conversationId}`);
    },
  });

  useEffect(() => {
    if (hydrated && !user) {
      router.push("/login");
    }
  }, [hydrated, router, user]);

  if (!hydrated || !user) return null;

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
