import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import type { WorkItem } from "@/lib/types";

export default function WorkCard({ work }: { work: WorkItem }) {
  return (
    <div className="group mb-5 break-inside-avoid rounded-3xl border bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link
        href={`/work/${work.id}`}
        className="relative block overflow-hidden rounded-3xl"
      >
        <div className="aspect-[4/5] w-full bg-slate-100">
          <img
            src={work.imageUrl}
            alt={work.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        </div>
        <div className="absolute inset-0 bg-slate-900/5 opacity-0 transition group-hover:opacity-100" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent px-4 pb-4 pt-10 text-white">
          <div className="text-base font-semibold line-clamp-2">{work.title}</div>
          {work.description ? (
            <div className="mt-1 text-xs text-white/80 line-clamp-2">
              {work.description}
            </div>
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
