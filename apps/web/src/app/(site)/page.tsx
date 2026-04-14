import Link from "next/link";
import WorkFeed from "@/features/works/components/WorkFeed";
import LottieBanner from "@/shared/components/LottieBanner";
import { Button } from "@/components/ui/button";
import { serverFetch } from "@/lib/serverApi";
import type { Paginated, WorkItem } from "@/lib/types";

export default async function HomePage() {
  const result = await serverFetch<Paginated<WorkItem>>(
    "/works?page=1&pageSize=12",
  );
  const page = result.data ?? {
    items: [],
    page: 1,
    pageSize: 12,
    total: 0,
    hasMore: false,
  };

  return (
    <div className="space-y-10">
      <section className="grid gap-6 rounded-3xl border bg-white/70 p-10 shadow-sm">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Astroimg 社区</p>
          <h1 className="text-4xl font-semibold leading-tight">
            记录星空、分享观测、找到同行者
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            在这里整理你的观测日志、分享影像与设备经验，与天文爱好者共同成长。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/work/create">
            <Button>发布作品</Button>
          </Link>
          <Link href="/explore">
            <Button variant="secondary">探索社区</Button>
          </Link>
          <Link href="/post/create">
            <Button variant="ghost">写帖子</Button>
          </Link>
        </div>
      </section>

      <LottieBanner />

      <section className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">最新作品</h2>
          <span className="text-sm text-muted-foreground">社区精选</span>
        </div>
        <div className="mx-auto w-full max-w-7xl px-6 lg:max-w-[1400px]">
          <WorkFeed initialPage={page} pageSize={12} />
        </div>
      </section>
    </div>
  );
}
