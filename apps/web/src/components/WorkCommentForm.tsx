"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUserStore } from "@/stores/userStore";
import { createWorkComment } from "@/services/workCommentApi";
import { showApiErrorToast } from "@/lib/showApiErrorToast";

export default function WorkCommentForm({ workId }: { workId: string }) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [content, setContent] = useState("");
  const maxLength = 300;
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!content.trim()) return;
    if (content.length > maxLength) return;

    setLoading(true);
    try {
      await createWorkComment(workId, { content });
      setContent("");
      router.refresh();
    } catch (err) {
      showApiErrorToast(err, {
        title: "评论失败",
        fallback: "评论失败，请稍后再试。",
      });
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
        <span>
          {content.length}/{maxLength}
        </span>
        {content.length > maxLength ? (
          <span className="text-red-500">内容过长</span>
        ) : null}
      </div>
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
