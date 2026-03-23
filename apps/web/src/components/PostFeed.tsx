"use client";

import { useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import PostCard from "@/components/PostCard";
import { fetchPostsByUserPage, fetchPostsPage, type PostListItem } from "@/services/postApi";
import type { Paginated } from "@/lib/types";

interface PostFeedProps {
  initialPage?: Paginated<PostListItem>;
  pageSize?: number;
  emptyText?: string;
  keyword?: string;
  userId?: string;
}

export default function PostFeed({
  initialPage,
  pageSize = 10,
  emptyText = "还没有内容。",
  keyword,
  userId,
}: PostFeedProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const fetchingRef = useRef(false);

  const isUserFeed = Boolean(userId);
  const seedPage: Paginated<PostListItem> =
    initialPage ?? {
      items: [],
      page: 1,
      pageSize,
      total: 0,
      hasMore: false,
    };
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ["posts", "feed", userId ?? "all", pageSize, keyword ?? ""],
    queryFn: ({ pageParam = 1 }) => {
      if (isUserFeed && userId) {
        return fetchPostsByUserPage(userId, pageParam, pageSize).then(
          (res) => res.data,
        );
      }
      return fetchPostsPage(pageParam, pageSize, keyword).then((res) => res.data);
    },
    initialData: {
      pages: [seedPage],
      pageParams: [1],
    },
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.page + 1 : undefined,
  });

  const posts = useMemo(
    () => {
      const map = new Map<string, PostListItem>();
      console.log("合并分页数据", data);
      for (const page of data?.pages ?? []) {
        for (const post of page.items ?? []) {
          if (!map.has(post.id)) {
            map.set(post.id, post);
          }
        }
      }
      return Array.from(map.values());
    },
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
          .catch(() => { })
          .finally(() => {
            fetchingRef.current = false;
          });
      },
      { rootMargin: "200px", threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (posts.length === 0 && !isFetching) {
    return <div className="text-sm text-muted-foreground">{emptyText}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            id={post.id}
            title={post.title}
            excerpt={post.content}
            author={post.author?.username || post.authorId}
            authorId={post.authorId}
            tag="观测日志"
            likeCount={post.likeCount}
            commentCount={post.commentCount}
            highlight={keyword}
            createdAt={post.createdAt}
          />
        ))}
      </div>
      <div ref={sentinelRef} />
      {isFetchingNextPage ? (
        <div className="text-center text-xs text-muted-foreground">加载中...</div>
      ) : null}
      {!hasNextPage && posts.length > 0 ? (
        <div className="text-center text-xs text-muted-foreground">没有更多了</div>
      ) : null}
    </div>
  );
}
