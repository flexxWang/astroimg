"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentFormProps {
  error?: string | null;
  isSubmitting?: boolean;
  maxLength?: number;
  onSubmit: (content: string) => Promise<boolean | void> | boolean | void;
  placeholder?: string;
  submitLabel?: string;
}

export default function CommentForm({
  error,
  isSubmitting = false,
  maxLength = 300,
  onSubmit,
  placeholder = "写下你的评论...",
  submitLabel = "发布评论",
}: CommentFormProps) {
  const [content, setContent] = useState("");

  const handleSubmit = async () => {
    const nextContent = content.trim();
    if (!nextContent) return;
    if (nextContent.length > maxLength) return;

    try {
      const shouldReset = await onSubmit(nextContent);
      if (shouldReset !== false) {
        setContent("");
      }
    } catch {
      // Error state is controlled by the parent mutation handler.
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        placeholder={placeholder}
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
          disabled={
            isSubmitting || !content.trim() || content.trim().length > maxLength
          }
        >
          {isSubmitting ? "发送中..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
