import ExploreSearch from "@/features/explore/components/ExploreSearch";
import PostFeed from "@/features/posts/components/PostFeed";
import { serverFetch } from "@/lib/serverApi";
import type { Paginated, PostListItem } from "@/lib/types";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const keyword = typeof q === "string" ? q : "";
  const query = keyword
    ? `/posts?page=1&pageSize=10&keyword=${encodeURIComponent(keyword)}`
    : "/posts?page=1&pageSize=10";
  const result = await serverFetch<Paginated<PostListItem>>(query);
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
        <ExploreSearch />
      </div>
      <PostFeed
        initialPage={page}
        pageSize={10}
        keyword={keyword}
        emptyText="没有匹配内容。"
      />
    </div>
  );
}
