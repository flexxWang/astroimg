"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Camera, ImageIcon, MessageCircle } from "lucide-react";
import WorkCommentsSection from "@/features/works/components/WorkCommentsSection";
import WorkLikeButton from "@/features/works/components/WorkLikeButton";
import WorkMediaGallery from "@/features/works/components/WorkMediaGallery";
import { workDetailQueryOptions } from "@/features/works/queries/workDetailQuery";
import { Badge } from "@/components/ui/badge";
import type { WorkComment, WorkItem } from "@/lib/types";
import UserAvatar from "@/shared/components/UserAvatar";

function formatDate(date?: string) {
  if (!date) return "未知日期";
  return new Date(date).toLocaleDateString();
}

export default function WorkDetailContent({
  initialComments,
  initialWork,
  workId,
}: {
  initialComments: WorkComment[];
  initialWork: WorkItem;
  workId: string;
}) {
  const { data } = useQuery(workDetailQueryOptions(workId, initialWork));
  const work = data ?? initialWork;
  const images = work.imageUrls?.length
    ? work.imageUrls
    : work.imageUrl
      ? [work.imageUrl]
      : [];
  const authorName = work.author?.username || work.authorId;
  const commentCount = work.commentCount ?? initialComments.length;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-sm backdrop-blur">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="border-b p-4 sm:p-5 lg:border-b-0 lg:border-r">
            <WorkMediaGallery
              images={images}
              title={work.title}
              videoUrl={work.videoUrl}
            />
          </div>

          <aside className="flex flex-col bg-white p-5 sm:p-6">
            <div className="space-y-5">
              <div className="space-y-3">
                <Badge variant="secondary">作品详情</Badge>
                <h1 className="text-2xl font-semibold leading-tight tracking-tight">
                  {work.title}
                </h1>
                <Link
                  href={`/user/${work.authorId}`}
                  className="flex items-center gap-3 rounded-xl border bg-slate-50 p-3 transition hover:bg-slate-100"
                >
                  <UserAvatar name={authorName} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {authorName}
                    </p>
                    <p className="text-xs text-muted-foreground">查看作者主页</p>
                  </div>
                </Link>
              </div>

              <dl className="grid gap-3 text-sm">
                <div className="flex items-center gap-3 rounded-xl border bg-white p-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <ImageIcon className="size-4" />
                  </span>
                  <div>
                    <dt className="text-xs text-muted-foreground">作品类型</dt>
                    <dd className="font-medium">
                      {work.type?.name || "未设置类型"}
                    </dd>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border bg-white p-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Camera className="size-4" />
                  </span>
                  <div>
                    <dt className="text-xs text-muted-foreground">拍摄设备</dt>
                    <dd className="font-medium">
                      {work.device?.name || "未设置设备"}
                    </dd>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border bg-white p-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <CalendarDays className="size-4" />
                  </span>
                  <div>
                    <dt className="text-xs text-muted-foreground">发布时间</dt>
                    <dd className="font-medium">{formatDate(work.createdAt)}</dd>
                  </div>
                </div>
              </dl>

              {work.description ? (
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    作品描述
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {work.description}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-6 border-t pt-5 lg:mt-auto">
              <div className="flex items-center gap-3">
                <WorkLikeButton
                  workId={work.id}
                  initialCount={work.likeCount ?? 0}
                />
                <div className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-secondary px-2.5 text-sm font-medium text-secondary-foreground">
                  <MessageCircle className="size-4" />
                  {commentCount}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur sm:p-6">
        <WorkCommentsSection
          workId={work.id}
          initialComments={initialComments}
        />
      </div>
    </div>
  );
}
