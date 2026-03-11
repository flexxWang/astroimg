import FollowButton from "@/components/FollowButton";
import PostCard from "@/components/PostCard";
import UserAvatar from "@/components/UserAvatar";
import { serverFetch } from "@/lib/serverApi";
import type { PostListItem, UserProfile } from "@/lib/types";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userResult = await serverFetch<{ success: boolean; data: UserProfile }>(
    `/users/${id}`,
  );
  const postsResult = await serverFetch<{ success: boolean; data: PostListItem[] }>(
    `/posts/user/${id}`,
  );

  const user = userResult.data;
  const posts = postsResult.data ?? [];

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center gap-6 rounded-2xl border bg-white/80 p-6 shadow-sm">
        <UserAvatar name={user?.username || "用户"} size="lg" />
        <div className="flex-1 space-y-2">
          <h1 className="text-2xl font-semibold">{user?.username || "用户"}</h1>
          <p className="text-sm text-muted-foreground">
            {user?.bio || "这个人还没有填写简介"}
          </p>
        </div>
        <FollowButton userId={id} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">最近发布</h2>
        {posts.length === 0 ? (
          <div className="text-sm text-muted-foreground">暂无帖子</div>
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
      </section>
    </div>
  );
}
