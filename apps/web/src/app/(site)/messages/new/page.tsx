"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUserStore } from "@/stores/userStore";
import { sendMessage } from "@/services/messageApi";
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
  const user = useUserStore((state) => state.user);
  const hydrated = useUserStore((state) => state.hydrated);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hydrated && !user) {
      router.push("/login");
    }
  }, [hydrated, router, user]);

  if (!hydrated || !user) return null;

  const handleSend = async () => {
    if (!recipientId || !content.trim()) return;
    setLoading(true);
    try {
      const result = await sendMessage(recipientId, content);
      router.push(`/messages/${result.data.conversationId}`);
    } finally {
      setLoading(false);
    }
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
        <Button onClick={handleSend} disabled={loading || !content.trim()}>
          {loading ? "发送中..." : "发送"}
        </Button>
      </div>
    </div>
  );
}
