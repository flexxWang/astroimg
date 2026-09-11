"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { sanitizeHtml } from "@/lib/sanitize";
import PostEditor from "./PostEditor";

export const POST_TITLE_LIMIT = 100;

export function hasMeaningfulPostContent(html: string) {
  if (
    /<(img|table)\b/i.test(html) ||
    /data-type="(video-embed|attachment|formula)"/.test(html)
  ) {
    return true;
  }

  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim()
    .length > 0;
}

function getPlainTextLength(html: string) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim().length;
}

function formatSaveState(lastSavedAt: Date | null, fallbackText: string) {
  if (!lastSavedAt) return fallbackText;

  return `${lastSavedAt.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })} · 草稿`;
}

type PostWritingPageProps = {
  title: string;
  content: string;
  loading?: boolean;
  saveStateText?: string;
  saveButtonText?: string;
  publishButtonText?: string;
  publishingText?: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onPublish: () => void;
};

export default function PostWritingPage({
  title,
  content,
  loading = false,
  saveStateText = "尚未保存",
  saveButtonText = "草稿备份",
  publishButtonText = "发布",
  publishingText = "发布中...",
  onTitleChange,
  onContentChange,
  onSave,
  onPublish,
}: PostWritingPageProps) {
  const titleInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const canPublish = Boolean(title.trim() && hasMeaningfulPostContent(content));
  const safePreviewContent = sanitizeHtml(content);
  const contentTextLength = getPlainTextLength(content);

  useEffect(() => {
    const input = titleInputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
  }, [title]);

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
          标题 {title.length}/{POST_TITLE_LIMIT}
        </div>
      </div>
      <PostEditor
        onChange={onContentChange}
        value={content}
        placeholder="请输入正文"
        className="flex-1"
        showStatusBar={false}
        paperHeader={
          <div className="mb-7">
            <textarea
              ref={titleInputRef}
              value={title}
              maxLength={POST_TITLE_LIMIT}
              placeholder="请输入标题（最多 100 个字）"
              onChange={(event) => onTitleChange(event.target.value)}
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
          <Button type="button" variant="secondary" onClick={onSave}>
            {saveButtonText}
          </Button>
          <Button onClick={onPublish} disabled={loading || !canPublish}>
            {loading ? publishingText : publishButtonText}
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

export { formatSaveState };
