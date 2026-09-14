"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Flame, MessageCircle, ThumbsUp } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  DEFAULT_POST_FEED_PAGE_SIZE,
  postFeedQueryOptions,
} from "@/features/posts/queries/postFeedQuery";
import { type PostListItem } from "@/features/posts/services/postApi";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import PostEditLink from "@/features/posts/components/PostEditLink";
import UserAvatar from "@/shared/components/UserAvatar";
import ContentThumbnail from "@/shared/components/ContentThumbnail";
import { firstImageSrc, stripHtml } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Paginated } from "@/lib/types";

interface ExploreHotFeedProps {
  initialPage?: Paginated<PostListItem>;
  pageSize?: number;
  emptyText?: string;
  keyword?: string;
}

function highlightText(text: string, keyword?: string) {
  const value = keyword?.trim();
  if (!value) return text;
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "gi");
  const parts = text.split(regex);
  if (parts.length === 1) return text;
  const matches = text.match(regex) ?? [];

  return parts.flatMap((part, index) => {
    const match = matches[index];
    return match
      ? [
          part,
          <mark key={`${match}-${index}`} className="rounded bg-amber-200/70 px-0.5">
            {match}
          </mark>,
        ]
      : [part];
  });
}

function formatDate(value?: string) {
  if (!value) return "刚刚";
  return new Date(value).toLocaleDateString();
}

function getHeat(post: PostListItem) {
  const likes = post.likeCount ?? 0;
  const comments = post.commentCount ?? 0;
  return likes * 12 + comments * 18 + 128;
}

function formatHeat(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)} 万热度`;
  return `${value} 热度`;
}

export default function ExploreHotFeed({
  initialPage,
  pageSize = DEFAULT_POST_FEED_PAGE_SIZE,
  emptyText = "还没有内容。",
  keyword,
}: ExploreHotFeedProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const fetchingRef = useRef(false);
  const { user } = useCurrentUser();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useInfiniteQuery(
    postFeedQueryOptions(
      {
        pageSize,
        keyword,
      },
      initialPage,
    ),
  );

  const posts: PostListItem[] = [];
  const seenIds = new Set<string>();
  for (const page of data?.pages ?? []) {
    for (const post of page.items ?? []) {
      if (!seenIds.has(post.id)) {
        seenIds.add(post.id);
        posts.push(post);
      }
    }
  }

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
      { rootMargin: "240px", threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (posts.length === 0 && !isFetching) {
    return (
      <div className="border-y bg-white/70 px-5 py-12 text-center text-sm text-muted-foreground backdrop-blur">
        {emptyText}
      </div>
    );
  }

  return (
    <section className="overflow-hidden border-y bg-white/78 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Flame className="size-4 text-orange-500" />
          <span>社区热榜</span>
        </div>
        <span className="text-xs text-muted-foreground">
          按互动热度排序展示
        </span>
      </div>

      <ol className="divide-y">
        {posts.map((post, index) => {
          const rank = index + 1;
          const heat = getHeat(post);
          const thumbnail = firstImageSrc(post.content);
          return (
            <li key={post.id} className="group">
              <div
                className={cn(
                  "grid gap-4 px-4 py-4 transition hover:bg-slate-50/90 sm:px-5",
                  thumbnail
                    ? "sm:grid-cols-[3rem_minmax(0,1fr)_8.5rem]"
                    : "sm:grid-cols-[3rem_minmax(0,1fr)]",
                )}
              >
                <div
                  className={cn(
                    "pt-0.5 text-center text-xl font-semibold tabular-nums text-muted-foreground sm:text-2xl",
                    rank === 1 && "text-red-500",
                    rank === 2 && "text-orange-500",
                    rank === 3 && "text-amber-500",
                  )}
                >
                  {rank}
                </div>

                <div className="min-w-0 space-y-2">
                  <Link
                    href={`/post/${post.id}`}
                    className="block min-w-0 text-base font-semibold leading-snug hover:text-blue-600 sm:text-lg"
                  >
                    {highlightText(post.title, keyword)}
                  </Link>

                  <Link
                    href={`/post/${post.id}`}
                    className="max-h-12 overflow-hidden text-sm leading-6 text-muted-foreground group-hover:text-slate-600"
                    style={{
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 2,
                    }}
                  >
                    {highlightText(stripHtml(post.content), keyword)}
                  </Link>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <Link
                      href={`/user/${post.authorId}`}
                      className="flex items-center gap-2 hover:text-foreground"
                    >
                      <UserAvatar
                        name={post.author?.username || post.authorId}
                        size="sm"
                      />
                      <span>{post.author?.username || post.authorId}</span>
                    </Link>
                    <span>{formatDate(post.createdAt)}</span>
                    <span className="inline-flex items-center gap-1">
                      <ThumbsUp className="size-3.5" />
                      {post.likeCount ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="size-3.5" />
                      {post.commentCount ?? 0}
                    </span>
                    <span className="rounded-sm bg-orange-50 px-1.5 py-0.5 font-medium text-orange-600">
                      {formatHeat(heat)}
                    </span>
                    {user?.id === post.authorId ? (
                      <PostEditLink
                        postId={post.id}
                        className="h-auto rounded-none border-0 bg-transparent p-0 text-xs text-blue-600 shadow-none hover:translate-y-0 hover:border-transparent hover:bg-transparent hover:text-blue-700 hover:shadow-none"
                      />
                    ) : null}
                  </div>
                </div>

                <ContentThumbnail
                  href={`/post/${post.id}`}
                  src={thumbnail}
                  alt={post.title || "内容图片"}
                  className="sm:mt-1"
                />
              </div>
            </li>
          );
        })}
      </ol>

      <div ref={sentinelRef} />
      {isFetchingNextPage ? (
        <div className="border-t py-4 text-center text-xs text-muted-foreground">
          加载中...
        </div>
      ) : null}
      {!hasNextPage && posts.length > 0 ? (
        <div className="border-t py-4 text-center text-xs text-muted-foreground">
          没有更多了
        </div>
      ) : null}
    </section>
  );
}
