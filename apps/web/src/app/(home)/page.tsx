import Link from "next/link";
import { ArrowRight, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createEmptyWorkFeedPage,
  DEFAULT_WORK_FEED_PAGE_SIZE,
} from "@/features/works/queries/workFeedQuery";
import { serverFetch } from "@/lib/serverApi";
import type { Paginated, WorkItem } from "@/lib/types";

export default async function LandingPage() {
  const page = await serverFetch<Paginated<WorkItem>>(
    `/works?page=1&pageSize=${DEFAULT_WORK_FEED_PAGE_SIZE}`,
  )
    .then((result) => result.data ?? createEmptyWorkFeedPage())
    .catch(() => createEmptyWorkFeedPage());

  const featuredWork = page.items[0];
  const featuredCover = featuredWork?.imageUrls?.[0] || featuredWork?.imageUrl;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      {featuredCover ? (
        <>
          {/* User-uploaded media can be served from dynamic origins at runtime. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={featuredCover}
            alt={featuredWork.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.82)_0%,rgba(2,6,23,0.48)_45%,rgba(2,6,23,0.18)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-slate-950/20" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(145deg,#020617,#111827_48%,#164e63)]" />
      )}

      <header className="relative z-10 mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6">
        <Link href="/" className="text-xl font-semibold tracking-wide">
          Astroimg
        </Link>
        <nav className="flex items-center gap-5 text-sm text-white/75">
          <Link href="/community" className="hover:text-white">
            社区
          </Link>
          <Link href="/explore" className="hover:text-white">
            探索
          </Link>
          <Link href="/map" className="hover:text-white">
            地图
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-7xl items-center px-6 pb-16">
        <div className="max-w-3xl space-y-7">
          <div className="space-y-5">
            <h1 className="text-5xl font-semibold leading-tight sm:text-7xl">
              追光入夜，定格星河
            </h1>
            <p className="max-w-xl text-base leading-8 text-slate-200 sm:text-lg">
              分享你的天文影像与观测故事。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              className="h-10 bg-white text-slate-950 hover:!bg-slate-200 hover:!text-slate-950"
            >
              <Link href="/community">
                进入社区
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-10 border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white"
            >
              <Link href="/work/create">
                <ImagePlus className="size-4" />
                发布作品
              </Link>
            </Button>
          </div>
        </div>
      </section>

    </main>
  );
}
