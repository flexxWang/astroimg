"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import {
  removeDraftFromCache,
  upsertDraftInCache,
} from "@/features/drafts/draftCache";
import PostWritingPage, {
  formatSaveState,
  hasMeaningfulPostContent,
} from "@/features/posts/components/PostWritingPage";
import { createPost } from "@/features/posts/services/postApi";
import {
  createDraft,
  publishDraft,
  updateDraft,
} from "@/features/drafts/services/draftApi";
import { useToast } from "@/hooks/useToast";
import { showErrorToast, showSuccessToast } from "@/lib/showToastMessage";

export default function CreatePostPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const { hasToast } = useToast();
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

    if (!title.trim() || !hasMeaningfulPostContent(content)) {
      if (!hasToast("请补全内容")) {
        showErrorToast("请补全内容", "标题和正文不能为空。");
      }
      return;
    }
    setLoading(true);
    try {
      if (draftId) {
        const draft = await updateDraft(draftId, { title, content });
        upsertDraftInCache(queryClient, user?.id, draft.data);
        const result = await publishDraft(draftId);
        removeDraftFromCache(queryClient, user?.id, draftId);
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
        const result = await updateDraft(draftId, { title, content });
        upsertDraftInCache(queryClient, user?.id, result.data);
      } else {
        const result = await createDraft({ title, content });
        setDraftId(result.data.id);
        upsertDraftInCache(queryClient, user?.id, result.data);
      }
      lastSavedRef.current = { title, content };
      setLastSavedAt(new Date());
      showSuccessToast("草稿已保存");
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <PostWritingPage
      title={title}
      content={content}
      loading={loading}
      saveStateText={formatSaveState(
        lastSavedAt,
        draftId ? "已保存 · 草稿" : "尚未保存",
      )}
      onTitleChange={setTitle}
      onContentChange={setContent}
      onSave={handleSaveDraft}
      onPublish={handlePublish}
    />
  );
}
