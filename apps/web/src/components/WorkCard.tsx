import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import type { WorkItem } from "@/lib/types";

export default function WorkCard({ work }: { work: WorkItem }) {
  const cover = work.imageUrls?.[0] || work.imageUrl;
  const imageCount = work.imageUrls?.length ?? (work.imageUrl ? 1 : 0);
  return (
    <div className="group mb-5 break-inside-avoid rounded-3xl border bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link
        href={`/work/${work.id}`}
        className="relative block overflow-hidden rounded-3xl"
      >
        <div className="aspect-[4/5] w-full bg-slate-100">
          {work.videoUrl ? (
            <video
              src={work.videoUrl}
              className="h-full w-full object-cover"
              preload="metadata"
              muted
              playsInline
            />
          ) : cover ? (
            <img
              src={cover}
              alt={work.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              暂无媒体
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-slate-900/5 opacity-0 transition group-hover:opacity-100" />
        {work.videoUrl ? (
          <div className="absolute left-3 top-3 rounded-full bg-slate-900/70 px-2 py-1 text-[10px] text-white">
            视频
          </div>
        ) : imageCount > 1 ? (
          <div className="absolute left-3 top-3 rounded-full bg-slate-900/70 px-2 py-1 text-[10px] text-white">
            多图 {imageCount}
          </div>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent px-4 pb-4 pt-10 text-white">
          <div className="text-base font-semibold line-clamp-2">{work.title}</div>
          {work.description ? (
            <div className="mt-1 text-xs text-white/80 line-clamp-2">
              {work.description}
            </div>
          ) : null}
          {work.videoUrl ? (
            <span className="mt-2 inline-flex rounded-full bg-white/15 px-2 py-0.5 text-[10px]">
              视频
            </span>
          ) : null}
        </div>
      </Link>
      <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">
        <Link
          href={`/user/${work.authorId}`}
          className="flex items-center gap-2 hover:text-foreground"
        >
          <UserAvatar
            name={work.author?.username || work.authorId}
            size="sm"
            className="h-7 w-7 text-[10px]"
          />
          <span>{work.author?.username || work.authorId}</span>
        </Link>
        <div className="flex items-center gap-2">
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
