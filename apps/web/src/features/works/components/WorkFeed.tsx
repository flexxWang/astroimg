"use client";

import { useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchWorksByUserPage, fetchWorksPage } from "@/features/works/services/workApi";
import type { Paginated, WorkItem } from "@/lib/types";
import WorkCard from "@/features/works/components/WorkCard";

export default function WorkFeed({
  initialPage,
  pageSize = 12,
  userId,
}: {
  initialPage?: Paginated<WorkItem>;
  pageSize?: number;
  userId?: string;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const fetchingRef = useRef(false);

  const isUserFeed = Boolean(userId);
  const seedPage: Paginated<WorkItem> =
    initialPage ?? {
      items: [],
      page: 1,
      pageSize,
      total: 0,
      hasMore: false,
    };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["works", "feed", userId ?? "all", pageSize],
      queryFn: ({ pageParam = 1 }) => {
        if (isUserFeed && userId) {
          return fetchWorksByUserPage(userId, pageParam, pageSize).then(
            (res) => res.data,
          );
        }
        return fetchWorksPage(pageParam, pageSize).then((res) => res.data);
      },
      initialPageParam: 1,
      initialData: {
        pages: [seedPage],
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
