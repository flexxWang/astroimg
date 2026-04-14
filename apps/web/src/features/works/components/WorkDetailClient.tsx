"use client";

import React from "react";
import Link from "next/link";
import UserAvatar from "@/shared/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import WorkCommentForm from "@/features/works/components/WorkCommentForm";
import WorkCommentList from "@/features/works/components/WorkCommentList";
import WorkLikeButton from "@/features/works/components/WorkLikeButton";
import ImageViewer from "@/shared/components/ImageViewer";
import type { WorkComment, WorkItem } from "@/lib/types";

export default function WorkDetailClient({
  work,
  comments,
  images,
}: {
  work: WorkItem;
  comments: WorkComment[];
  images: string[];
}) {
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  const openAt = (idx: number) => {
    setIndex(idx);
    setOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Badge variant="secondary">作品</Badge>
        <h1 className="text-3xl font-semibold">{work.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Link
            href={`/user/${work.authorId}`}
            className="flex items-center gap-2 hover:text-foreground"
          >
            <UserAvatar name={work.author?.username || work.authorId} size="sm" />
            <span>{work.author?.username || work.authorId}</span>
          </Link>
          {work.type?.name ? <span>· {work.type.name}</span> : null}
          {work.device?.name ? <span>· {work.device.name}</span> : null}
          {work.createdAt ? (
            <span>· {new Date(work.createdAt).toLocaleDateString()}</span>
          ) : null}
        </div>
      </div>

      <section className="space-y-4">
        {work.videoUrl ? (
          <div className="overflow-hidden rounded-3xl border bg-slate-900/95 shadow-lg">
            <video
              src={work.videoUrl}
              controls
              className="w-full aspect-video object-cover"
            />
          </div>
        ) : images.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
            <div
              className="overflow-hidden rounded-3xl border bg-white/90 shadow-sm cursor-zoom-in"
              onClick={() => openAt(0)}
            >
              {/* User-uploaded media can be served from dynamic origins at runtime. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[0]}
                alt={work.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
              {images.slice(1, 5).map((url, idx) => (
                <div
                  key={url}
                  className="overflow-hidden rounded-2xl border bg-white/90 cursor-zoom-in"
                  onClick={() => openAt(idx + 1)}
                >
                  {/* User-uploaded media can be served from dynamic origins at runtime. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={work.title} className="h-full w-full object-cover" />
                </div>
              ))}
              {images.length > 5 ? (
                <button
                  type="button"
                  className="flex items-center justify-center rounded-2xl border bg-white/80 text-sm text-muted-foreground"
                  onClick={() => openAt(5)}
                >
                  +{images.length - 5} 更多
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex h-[320px] items-center justify-center rounded-3xl border bg-white/80 text-sm text-muted-foreground shadow-sm">
            暂无媒体内容
          </div>
        )}
      </section>

      {work.description ? (
        <div className="rounded-2xl border bg-white/80 p-6 text-sm text-muted-foreground shadow-sm">
          {work.description}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <WorkLikeButton workId={work.id} initialCount={work.likeCount ?? 0} />
        <span className="text-sm text-muted-foreground">
          评论 {work.commentCount ?? comments.length}
        </span>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">评论</h2>
        <WorkCommentForm workId={work.id} />
        {comments.length === 0 ? (
          <div className="text-sm text-muted-foreground">暂无评论</div>
        ) : (
          <WorkCommentList comments={comments} />
        )}
      </section>

      <ImageViewer
        open={open}
        images={images}
        index={index}
        onClose={() => setOpen(false)}
        onChange={setIndex}
      />
    </div>
  );
}
