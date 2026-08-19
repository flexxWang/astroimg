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

  return (
    <div className="space-y-6">
      <div className="columns-1 gap-3 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5">
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
