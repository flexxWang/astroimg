import Link from "next/link";
import {
  Aperture,
  ArrowRight,
  Compass,
  MapPinned,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import WorkFeed from "@/features/works/components/WorkFeed";
import {
  createEmptyWorkFeedPage,
  DEFAULT_WORK_FEED_PAGE_SIZE,
} from "@/features/works/queries/workFeedQuery";
import { excerpt } from "@/lib/format";
import { serverFetch } from "@/lib/serverApi";
import type { ObservationPoint, Paginated, WorkItem } from "@/lib/types";

export default async function CommunityPage() {
  const worksPromise = serverFetch<Paginated<WorkItem>>(
    `/works?page=1&pageSize=${DEFAULT_WORK_FEED_PAGE_SIZE}`,
  )
    .then((result) => result.data ?? createEmptyWorkFeedPage())
    .catch(() => createEmptyWorkFeedPage());
  const observationsPromise = serverFetch<ObservationPoint[]>("/observation-points")
    .then((result) => result.data ?? [])
    .catch(() => []);

  const [page, observationPoints] = await Promise.all([
    worksPromise,
    observationsPromise,
  ]);

  const featuredWork = page.items[0];
  const featuredCover = featuredWork?.imageUrls?.[0] || featuredWork?.imageUrl;
  const latestPoint = observationPoints[0];
  const quickLinks = [
    {
      href: "/explore",
      icon: Compass,
      label: "探索",
      desc: "经验与讨论",
      tone: "bg-sky-50 text-sky-700",
    },
    {
      href: "/map",
      icon: MapPinned,
      label: "地图",
      desc: latestPoint ? latestPoint.name : "观测点",
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      href: "/ai/copilot",
      icon: Sparkles,
      label: "AI 副驾",
      desc: "规划今晚",
      tone: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <Link
          href={featuredWork ? `/work/${featuredWork.id}` : "/work/create"}
          className="group relative block min-h-[430px] overflow-hidden rounded-3xl border bg-slate-950 shadow-sm sm:min-h-[500px]"
        >
          {featuredCover ? (
            <>
              {/* User-uploaded media can be served from dynamic origins at runtime. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={featuredCover}
                alt={featuredWork.title}
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-slate-950/10" />
            </>
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(145deg,#111827,#1f2937_50%,#164e63)]" />
          )}

          <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs text-white/85 backdrop-blur">
            <Aperture className="size-3.5" />
            今日焦点
          </div>

          <div className="absolute inset-x-0 bottom-0 max-w-3xl space-y-4 p-7 text-white sm:p-10">
            <p className="text-sm text-white/70">Astroimg 社区</p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              {featuredWork?.title ?? "记录星空、分享观测、找到同行者"}
            </h1>
            <p className="line-clamp-2 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
              {featuredWork?.description
                ? excerpt(featuredWork.description, 120)
                : "发布作品后，首页会用最新成片作为社区第一视觉。"}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/75">
              {featuredWork?.type?.name ? (
                <span className="rounded-full bg-white/15 px-2.5 py-1">
                  {featuredWork.type.name}
                </span>
              ) : null}
              {featuredWork?.device?.name ? (
                <span className="rounded-full bg-white/15 px-2.5 py-1">
                  {featuredWork.device.name}
                </span>
              ) : null}
              {featuredWork?.author?.username ? (
                <span>{featuredWork.author.username}</span>
              ) : null}
            </div>
          </div>
        </Link>

        <div className="grid gap-3 sm:grid-cols-3">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-4 rounded-2xl border bg-white/80 p-4 shadow-sm transition hover:bg-white"
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${item.tone}`}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{item.label}</span>
                  <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                    {item.desc}
                  </span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Community Feed</p>
            <h2 className="mt-1 text-2xl font-semibold">最新作品</h2>
          </div>
          <Button asChild variant="secondary">
            <Link href="/post/create">写观测日志</Link>
          </Button>
        </div>
        <WorkFeed initialPage={page} pageSize={DEFAULT_WORK_FEED_PAGE_SIZE} />
      </section>
    </div>
  );
}
