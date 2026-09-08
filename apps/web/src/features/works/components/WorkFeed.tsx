"use client";

import { useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  DEFAULT_WORK_FEED_PAGE_SIZE,
  workFeedQueryOptions,
} from "@/features/works/queries/workFeedQuery";
import type { Paginated, WorkItem } from "@/lib/types";
import WorkCard from "@/features/works/components/WorkCard";

export default function WorkFeed({
  initialPage,
  pageSize = DEFAULT_WORK_FEED_PAGE_SIZE,
  userId,
}: {
  initialPage?: Paginated<WorkItem>;
  pageSize?: number;
  userId?: string;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const fetchingRef = useRef(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(workFeedQueryOptions({ userId, pageSize }, initialPage));

  const works = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.items ?? []),
    [data?.pages],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (fetchingRef.current || !hasNextPage) return;
        fetchingRef.current = true;
        fetchNextPage()
          .catch(() => {})
          .finally(() => {
            fetchingRef.current = false;
          });
      },
      { rootMargin: "200px", threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (works.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-white/70 px-6 py-14 text-center text-sm text-muted-foreground">
        还没有作品，发布第一张星空影像吧。
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
        {works.map((work) => (
          <WorkCard key={work.id} work={work} />
        ))}
      </div>
      <div ref={sentinelRef} />
      {isFetchingNextPage ? (
        <div className="text-center text-xs text-muted-foreground">加载中...</div>
      ) : null}
      {!hasNextPage && works.length > 0 ? (
        <div className="text-center text-xs text-muted-foreground">没有更多了</div>
      ) : null}
    </div>
  );
}
