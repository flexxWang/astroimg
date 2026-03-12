"use client";

import { useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchWorksPage } from "@/services/workApi";
import type { Paginated, WorkItem } from "@/lib/types";
import WorkCard from "@/components/WorkCard";

export default function WorkFeed({
  initialPage,
  pageSize = 12,
}: {
  initialPage: Paginated<WorkItem>;
  pageSize?: number;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const fetchingRef = useRef(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["works", "feed", pageSize],
      queryFn: ({ pageParam = 1 }) =>
        fetchWorksPage(pageParam, pageSize).then((res) => res.data),
      initialData: {
        pages: [initialPage],
        pageParams: [1],
      },
      getNextPageParam: (lastPage) =>
        lastPage?.hasMore ? lastPage.page + 1 : undefined,
    });

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
