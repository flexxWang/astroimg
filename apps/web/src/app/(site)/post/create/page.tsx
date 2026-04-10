"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import PostEditor from "@/components/PostEditor";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/userStore";
import { createPost } from "@/services/postApi";
import { createDraft, publishDraft, updateDraft } from "@/services/draftApi";
import { useToast } from "@/hooks/useToast";
import { showErrorToast, showSuccessToast } from "@/lib/showToastMessage";

export default function CreatePostPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { hasToast } = useToast();
  const canPublish = Boolean(title.trim() && content.trim());
  const lastSavedRef = useRef({ title: "", content: "" });
  const [draftId, setDraftId] = useState<string | null>(null);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      const hasChanges =
        title !== lastSavedRef.current.title ||
        content !== lastSavedRef.current.content;
      if (!hasChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [title, content]);

  const handlePublish = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!title.trim() || !content.trim()) {
      if (!hasToast("请补全内容")) {
        showErrorToast("请补全内容", "标题和正文不能为空。");
      }
      return;
    }
    setLoading(true);
    try {
      if (draftId) {
        const result = await publishDraft(draftId);
        router.push(`/post/${result.data.id}`);
      } else {
        const result = await createPost({ title, content });
        router.push(`/post/${result.data.id}`);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      if (draftId) {
        await updateDraft(draftId, { title, content });
      } else {
        const result = await createDraft({ title, content });
        setDraftId(result.data.id);
      }
      lastSavedRef.current = { title, content };
      showSuccessToast("草稿已保存");
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-144px)] flex-col space-y-6">
      <div className="space-y-2">
        <Badge variant="secondary">发布新帖</Badge>
        <h1 className="text-2xl font-semibold">写下你的观测与影像</h1>
      </div>
      <div className="flex h-full flex-1 flex-col space-y-4 rounded-2xl border bg-white/80 p-6 shadow-sm min-h-0">
        <Input
          placeholder="标题"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <div className="flex-1 min-h-0">
          <PostEditor
            onChange={setContent}
            value={content}
            className="h-full min-h-0"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleSaveDraft}>
            保存草稿
          </Button>
          <Button onClick={handlePublish} disabled={loading || !canPublish}>
            {loading ? "发布中..." : "发布"}
          </Button>
        </div>
      </div>
    </div>
  );
}
