"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Heart, Images, MessageCircle, Play } from "lucide-react";
import UserAvatar from "@/shared/components/UserAvatar";
import type { WorkItem } from "@/lib/types";

export default function WorkCard({ work }: { work: WorkItem }) {
  const cover = work.imageUrls?.[0] || work.imageUrl;
  const imageCount = work.imageUrls?.length ?? (work.imageUrl ? 1 : 0);
  const [loadedImage, setLoadedImage] = useState<{
    src?: string;
    orientation: "portrait" | "landscape" | "square";
  }>({ orientation: "portrait" });
  const orientation =
    loadedImage.src === cover ? loadedImage.orientation : "portrait";

  const ratioClass =
    orientation === "landscape"
      ? "aspect-[4/3]"
      : orientation === "square"
        ? "aspect-square"
        : "aspect-[4/5]";

  const updateOrientation = useCallback((img: HTMLImageElement, src?: string) => {
    if (!img.naturalWidth || !img.naturalHeight) return;
    const ratio = img.naturalWidth / img.naturalHeight;
    let nextOrientation: "portrait" | "landscape" | "square" = "portrait";
    if (ratio > 1.2) {
      nextOrientation = "landscape";
    } else if (ratio > 0.85) {
      nextOrientation = "square";
    }

    setLoadedImage({
      src,
      orientation: nextOrientation,
    });
  }, []);

  const handleImageRef = useCallback(
    (img: HTMLImageElement | null) => {
      if (img?.complete) {
        updateOrientation(img, cover);
      }
    },
    [cover, updateOrientation],
  );

  const handleImageLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const img = event.currentTarget;
      updateOrientation(img, cover);
    },
    [cover, updateOrientation],
  );

  return (
    <article className="group mb-5 break-inside-avoid">
      <Link
        href={`/work/${work.id}`}
        className="relative block overflow-hidden rounded-lg bg-slate-100 shadow-sm ring-1 ring-black/5 transition duration-300 hover:shadow-xl hover:shadow-slate-950/10"
      >
        <div className={`relative w-full overflow-hidden bg-slate-100 ${ratioClass}`}>
          {work.videoUrl ? (
            <video
              src={work.videoUrl}
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.015]"
              preload="metadata"
              muted
              playsInline
            />
          ) : cover ? (
            <>
              {/* User-uploaded media can be served from dynamic origins at runtime. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={handleImageRef}
                src={cover}
                alt={work.title}
                onLoad={handleImageLoad}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.015]"
                loading="lazy"
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              暂无媒体
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
        <div className="absolute left-3 top-3 flex gap-2">
          {work.videoUrl ? (
            <span className="flex size-8 items-center justify-center rounded-full bg-black/45 text-white opacity-90 backdrop-blur">
              <Play className="size-3.5 fill-current" />
            </span>
          ) : imageCount > 1 ? (
            <span className="flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[11px] text-white opacity-90 backdrop-blur">
              <Images className="size-3.5" />
              {imageCount}
            </span>
          ) : null}
        </div>
        <div className="absolute inset-x-0 bottom-0 translate-y-2 p-4 text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="line-clamp-2 text-sm font-medium leading-5">
            {work.title}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-white/80">
            <span className="truncate">
              {work.type?.name || work.device?.name || "Astroimg"}
            </span>
            <span className="flex shrink-0 items-center gap-3">
              <span className="flex items-center gap-1">
                <Heart className="size-3.5" />
                {work.likeCount ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="size-3.5" />
                {work.commentCount ?? 0}
              </span>
            </span>
          </div>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-3 px-0.5 pt-2.5 text-xs text-muted-foreground">
        <Link
          href={`/user/${work.authorId}`}
          className="flex min-w-0 items-center gap-2 hover:text-foreground"
        >
          <UserAvatar
            name={work.author?.username || work.authorId}
            size="sm"
            className="h-6 w-6 text-[10px] ring-1 ring-black/5"
          />
          <span className="truncate font-medium text-slate-700">
            {work.author?.username || work.authorId}
          </span>
        </Link>
        <div className="flex items-center gap-2 whitespace-nowrap text-slate-400">
          {work.type?.name ? (
            <span>{work.type.name}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
