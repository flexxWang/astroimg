import PostFeed from "@/components/PostFeed";
import { Input } from "@/components/ui/input";
import { serverFetch } from "@/lib/serverApi";
import type { Paginated, PostListItem } from "@/lib/types";

export default async function ExplorePage() {
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">探索社区</h1>
        <Input placeholder="搜索主题、设备或观测目标" className="max-w-sm" />
      </div>
      <PostFeed initialPage={page} pageSize={10} />
    </div>
  );
}
