import PostCard from "@/components/PostCard";
import { Input } from "@/components/ui/input";
import { serverFetch } from "@/lib/serverApi";
import type { PostListItem } from "@/lib/types";

export default async function ExplorePage() {
  const result = await serverFetch<{ success: boolean; data: PostListItem[] }>(
    "/posts",
  );
  const posts = result.data ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">探索社区</h1>
        <Input placeholder="搜索主题、设备或观测目标" className="max-w-sm" />
      </div>
      {posts.length === 0 ? (
        <div className="text-sm text-muted-foreground">还没有内容。</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              title={post.title}
              excerpt={post.content}
              author={post.author?.username || post.authorId}
              tag="观测日志"
              likeCount={post.likeCount}
              commentCount={post.commentCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
