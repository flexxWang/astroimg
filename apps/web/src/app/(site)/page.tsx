import Link from "next/link";
import PostFeed from "@/components/PostFeed";
import { Button } from "@/components/ui/button";
import { serverFetch } from "@/lib/serverApi";
import type { Paginated, PostListItem } from "@/lib/types";

export default async function HomePage() {
  const result = await serverFetch<{ success: boolean; data: Paginated<PostListItem> }>(
    "/posts?page=1&pageSize=10",
  );
  const page = result.data ?? {
    items: [],
    page: 1,
    pageSize: 10,
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
          <Link href="/post/create">
            <Button>开始发布</Button>
          </Link>
          <Link href="/explore">
            <Button variant="secondary">探索社区</Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">最新分享</h2>
          <Link href="/explore" className="text-sm text-muted-foreground">
            查看更多
          </Link>
        </div>
        <PostFeed initialPage={page} pageSize={10} />
      </section>
    </div>
  );
}
