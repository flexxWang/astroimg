"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createComment } from "@/services/commentApi";
import { useUserStore } from "@/stores/userStore";

export default function CommentForm({ postId }: { postId: string }) {
  const router = useRouter();
  const token = useUserStore((state) => state.token);
  const [content, setContent] = useState("");
  const maxLength = 300;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (!content.trim()) return;
    if (content.length > maxLength) return;

    setLoading(true);
    setError(null);
    try {
      await createComment(token, postId, { content });
      setContent("");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="写下你的评论..."
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{content.length}/{maxLength}</span>
        {content.length > maxLength ? (
          <span className="text-red-500">内容过长</span>
        ) : null}
      </div>
      {error ? <div className="text-sm text-red-500">{error}</div> : null}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={loading || !content.trim() || content.length > maxLength}
        >
          {loading ? "发送中..." : "发布评论"}
        </Button>
      </div>
    </div>
  );
}
