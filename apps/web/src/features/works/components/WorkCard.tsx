"use client";

import { useState } from "react";
import Link from "next/link";
import UserAvatar from "@/shared/components/UserAvatar";
import type { WorkItem } from "@/lib/types";

export default function WorkCard({ work }: { work: WorkItem }) {
  const cover = work.imageUrls?.[0] || work.imageUrl;
  const imageCount = work.imageUrls?.length ?? (work.imageUrl ? 1 : 0);
  const [orientation, setOrientation] = useState<"portrait" | "landscape" | "square">(
    "portrait",
  );

  const ratioClass =
    orientation === "landscape"
      ? "aspect-[4/3]"
      : orientation === "square"
        ? "aspect-square"
        : "aspect-[4/5]";

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    if (!img.naturalWidth || !img.naturalHeight) return;
    const ratio = img.naturalWidth / img.naturalHeight;
    if (ratio > 1.2) {
      setOrientation("landscape");
    } else if (ratio > 0.85) {
      setOrientation("square");
    } else {
      setOrientation("portrait");
    }
  };
  return (
    <div className="group mb-6 break-inside-avoid">
      <Link
        href={`/work/${work.id}`}
        className="relative block overflow-hidden rounded-2xl bg-slate-900/5 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.45)] transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_18px_40px_-22px_rgba(15,23,42,0.55)]"
      >
        <div className={`relative w-full overflow-hidden bg-slate-100 ${ratioClass}`}>
          {work.videoUrl ? (
            <video
              src={work.videoUrl}
              className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              preload="metadata"
              muted
              playsInline
            />
          ) : cover ? (
            <>
              {/* User-uploaded media can be served from dynamic origins at runtime. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cover}
                alt={work.title}
                onLoad={handleImageLoad}
                className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                loading="lazy"
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              暂无媒体
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-slate-900/5 opacity-0 transition group-hover:opacity-100" />
        {work.videoUrl ? (
          <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white backdrop-blur">
            视频
          </div>
        ) : imageCount > 1 ? (
          <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white backdrop-blur">
            多图 {imageCount}
          </div>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 translate-y-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-4 pt-14 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 text-white">
          <div className="text-sm font-semibold line-clamp-2">{work.title}</div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-white/80">
            <UserAvatar
              name={work.author?.username || work.authorId}
              size="sm"
              className="h-6 w-6 text-[10px] bg-white/10 text-white"
            />
            <span>{work.author?.username || work.authorId}</span>
            {work.type?.name ? <span>· {work.type.name}</span> : null}
          </div>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-2 px-1 pt-2 text-xs text-muted-foreground">
        <Link
          href={`/user/${work.authorId}`}
          className="flex min-w-0 items-center gap-2 hover:text-foreground"
        >
          <UserAvatar
            name={work.author?.username || work.authorId}
            size="sm"
            className="h-6 w-6 text-[10px]"
          />
          <span className="truncate">{work.author?.username || work.authorId}</span>
        </Link>
        <div className="flex items-center gap-2 whitespace-nowrap">
          {work.type?.name ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
              {work.type.name}
            </span>
          ) : null}
          {work.device?.name ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
              {work.device.name}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
