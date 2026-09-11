"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import {
  removeDraftFromCache,
  upsertDraftInCache,
} from "@/features/drafts/draftCache";
import PostEditor from "@/features/posts/components/PostEditor";
import { createPost } from "@/features/posts/services/postApi";
import {
  createDraft,
  publishDraft,
  updateDraft,
} from "@/features/drafts/services/draftApi";
import { useToast } from "@/hooks/useToast";
import { showErrorToast, showSuccessToast } from "@/lib/showToastMessage";
import { sanitizeHtml } from "@/lib/sanitize";

const TITLE_LIMIT = 100;

function hasMeaningfulContent(html: string) {
  if (/<(img|table)\b/i.test(html) || /data-type="(video-embed|attachment|formula)"/.test(html)) {
    return true;
  }

  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim()
    .length > 0;
}

export default function CreatePostPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const titleInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const { hasToast } = useToast();
  const canPublish = Boolean(title.trim() && hasMeaningfulContent(content));
  const lastSavedRef = useRef({ title: "", content: "" });
  const [draftId, setDraftId] = useState<string | null>(null);

  useEffect(() => {
    const input = titleInputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
  }, [title]);

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

    if (!title.trim() || !hasMeaningfulContent(content)) {
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

  const safePreviewContent = sanitizeHtml(content);
  const contentTextLength = content
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim().length;
  const saveStateText = lastSavedAt
    ? `${lastSavedAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })} · 草稿`
    : draftId
      ? "已保存 · 草稿"
      : "尚未保存";

  return (
    <div className="-mx-6 -my-10 flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-white">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#e7eaf0] bg-white px-5">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="rounded-md">
            写文章
          </Badge>
          <span className="text-sm text-[#596172]">观测与影像社区</span>
        </div>
        <div className="text-xs text-[#8590a6]">
          标题 {title.length}/{TITLE_LIMIT}
        </div>
      </div>
      <PostEditor
        onChange={setContent}
        value={content}
        placeholder="请输入正文"
        className="flex-1"
        showStatusBar={false}
        paperHeader={
          <div className="mb-7">
            <textarea
              ref={titleInputRef}
              value={title}
              maxLength={TITLE_LIMIT}
              placeholder="请输入标题（最多 100 个字）"
              onChange={(event) => setTitle(event.target.value)}
              className="min-h-13 w-full resize-none overflow-hidden border-0 border-b border-[#ebebeb] bg-transparent pb-4 text-[30px] font-semibold leading-tight text-[#1f2329] outline-none placeholder:text-[#9aa2b1]"
              rows={1}
            />
          </div>
        }
      />
      <div className="flex h-12 shrink-0 items-center justify-between border-t border-[#e7eaf0] bg-white px-5">
        <div className="flex items-center gap-6 text-sm text-[#6b7890]">
          <button
            type="button"
            className="transition hover:text-[#1772f6]"
            onClick={() => setSettingsOpen(true)}
            disabled={loading}
          >
            发布设置⌄
          </button>
          <span>字数：{contentTextLength}</span>
          <span>{saveStateText}</span>
          <span>Markdown 语法输入中</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPreviewOpen((open) => !open)}
            disabled={!canPublish}
          >
            预览
          </Button>
          <Button type="button" variant="secondary" onClick={handleSaveDraft}>
            草稿备份
          </Button>
          <Button onClick={handlePublish} disabled={loading || !canPublish}>
            {loading ? "发布中..." : "发布"}
          </Button>
        </div>
      </div>
      {previewOpen ? (
        <div className="fixed inset-0 z-40 bg-black/30 p-6 backdrop-blur-sm">
          <div className="ml-auto flex h-full w-full max-w-3xl flex-col rounded-lg bg-white shadow-2xl">
            <div className="flex h-12 items-center justify-between border-b px-5">
              <span className="font-medium">文章预览</span>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPreviewOpen(false)}
              >
                关闭
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <h1 className="mb-6 text-3xl font-semibold">{title}</h1>
              <div
                className="rich-content text-sm leading-relaxed text-foreground"
                dangerouslySetInnerHTML={{ __html: safePreviewContent }}
              />
            </div>
          </div>
        </div>
      ) : null}
      {settingsOpen ? (
        <div className="fixed inset-0 z-40 bg-black/30 p-6 backdrop-blur-sm">
          <div className="mx-auto mt-20 w-full max-w-md rounded-lg bg-white shadow-2xl">
            <div className="flex h-12 items-center justify-between border-b px-5">
              <span className="font-medium">发布设置</span>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSettingsOpen(false)}
              >
                关闭
              </Button>
            </div>
            <div className="space-y-5 p-5 text-sm">
              <label className="flex items-center justify-between gap-4">
                <span>
                  <span className="block font-medium text-[#1f2329]">
                    公开发布
                  </span>
                  <span className="text-xs text-[#8590a6]">
                    发布后会进入社区内容流。
                  </span>
                </span>
                <input type="checkbox" defaultChecked className="size-4" />
              </label>
              <label className="flex items-center justify-between gap-4">
                <span>
                  <span className="block font-medium text-[#1f2329]">
                    允许评论
                  </span>
                  <span className="text-xs text-[#8590a6]">
                    保持和当前帖子详情页评论能力一致。
                  </span>
                </span>
                <input type="checkbox" defaultChecked className="size-4" />
              </label>
              <div>
                <div className="mb-2 font-medium text-[#1f2329]">内容类型</div>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="rounded-md">
                    观测日志
                  </Badge>
                  <Badge variant="secondary" className="rounded-md">
                    影像记录
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
