"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  removeDraftFromCache,
  upsertDraftInCache,
} from "@/features/drafts/draftCache";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import {
  fetchDraft,
  publishDraft,
  updateDraft,
} from "@/features/drafts/services/draftApi";
import PostWritingPage, {
  formatSaveState,
  hasMeaningfulPostContent,
} from "@/features/posts/components/PostWritingPage";
import { useToast } from "@/hooks/useToast";
import { showErrorToast, showSuccessToast } from "@/lib/showToastMessage";

export default function DraftEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const { hasToast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const draftId = params.id as string;

  useEffect(() => {
    if (!user) return;
    fetchDraft(draftId)
      .then((result) => {
        setTitle(result.data.title || "");
        setContent(result.data.content || "");
        setLastSavedAt(
          result.data.updatedAt ? new Date(result.data.updatedAt) : null,
        );
      })
      .catch(() => {});
  }, [draftId, user]);

  const handleSave = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const result = await updateDraft(draftId, { title, content });
      upsertDraftInCache(queryClient, user?.id, result.data);
      setLastSavedAt(new Date());
      showSuccessToast("草稿已保存");
    } catch {
    } finally {
      setLoading(false);
    }
  };

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
      const draft = await updateDraft(draftId, { title, content });
      upsertDraftInCache(queryClient, user?.id, draft.data);
      const result = await publishDraft(draftId);
      removeDraftFromCache(queryClient, user?.id, draftId);
      router.push(`/post/${result.data.id}`);
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
      saveStateText={formatSaveState(lastSavedAt, "尚未保存")}
      onTitleChange={setTitle}
      onContentChange={setContent}
      onSave={handleSave}
      onPublish={handlePublish}
    />
  );
}
