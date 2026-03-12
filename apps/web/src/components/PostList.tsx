"use client";

import { useQuery } from "@tanstack/react-query";
import PostCard from "@/components/PostCard";
import { fetchPosts } from "@/services/postApi";

export default function PostList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">加载中...</div>;
  }

  if (isError) {
    return <div className="text-sm text-red-500">加载失败，请稍后重试。</div>;
  }

  const posts = data?.data?.items ?? [];

  if (posts.length === 0) {
    return <div className="text-sm text-muted-foreground">还没有内容。</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          id={post.id}
          title={post.title}
          excerpt={post.content.slice(0, 80) + "..."}
          author={post.author?.username || post.authorId}
          authorId={post.authorId}
          tag="观测日志"
        />
      ))}
    </div>
  );
}
