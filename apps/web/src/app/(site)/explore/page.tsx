import ExploreSearch from "@/features/explore/components/ExploreSearch";
import ExploreHotFeed from "@/features/explore/components/ExploreHotFeed";
import {
  createEmptyPostFeedPage,
  DEFAULT_POST_FEED_PAGE_SIZE,
} from "@/features/posts/queries/postFeedQuery";
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
    ? `/posts?page=1&pageSize=${DEFAULT_POST_FEED_PAGE_SIZE}&keyword=${encodeURIComponent(keyword)}`
    : `/posts?page=1&pageSize=${DEFAULT_POST_FEED_PAGE_SIZE}`;
  const result = await serverFetch<Paginated<PostListItem>>(query);
  const page = result.data ?? createEmptyPostFeedPage();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">探索社区</h1>
          <p className="text-sm text-muted-foreground">
            发现正在被讨论的观测记录和创作灵感
          </p>
        </div>
        <ExploreSearch />
      </div>
      <ExploreHotFeed
        initialPage={page}
        pageSize={DEFAULT_POST_FEED_PAGE_SIZE}
        keyword={keyword}
        emptyText="没有匹配内容。"
      />
    </div>
  );
}
