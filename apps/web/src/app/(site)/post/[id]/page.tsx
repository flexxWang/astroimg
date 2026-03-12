import { notFound } from "next/navigation";
import CommentList from "@/components/CommentList";
import CommentForm from "@/components/CommentForm";
import FollowButton from "@/components/FollowButton";
import LikeButton from "@/components/LikeButton";
import UserAvatar from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { serverFetch } from "@/lib/serverApi";
import { sanitizeHtml } from "@/lib/sanitize";
import type { CommentItem } from "@/components/CommentList";
import type { PostListItem } from "@/lib/types";
import Link from "next/link";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await serverFetch<{ success: boolean; data: PostListItem }>(
    `/posts/${id}`,
  );
  const commentResult = await serverFetch<{
    success: boolean;
    data: CommentItem[];
  }>(`/posts/${id}/comments`);

  if (!result?.data) {
    notFound();
  }

  const post = result.data;
  const safeContent = sanitizeHtml(post.content);
  const comments = commentResult.data ?? [];

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Badge variant="secondary">观测日志</Badge>
        <h1 className="text-3xl font-semibold">{post.title}</h1>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar name={post.author?.username || post.authorId} />
            <div>
              <div className="text-sm font-medium">
                {post.author?.username || post.authorId}
              </div>
              <div className="text-xs text-muted-foreground">
                {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FollowButton userId={post.authorId} />
            <Link href={`/messages/new?to=${post.authorId}`}>
              <Button variant="secondary" size="sm">私信</Button>
            </Link>
          </div>
        </div>
      </div>

      <article className="space-y-4 rounded-2xl border bg-white/80 p-6 shadow-sm">
        <div
          className="rich-content text-sm leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: safeContent }}
        />
      </article>

      <div className="flex items-center gap-3">
        <LikeButton postId={post.id} initialCount={post.likeCount ?? 0} />
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">评论</h2>
        <CommentForm postId={id} />
        {comments.length === 0 ? (
          <div className="text-sm text-muted-foreground">暂无评论</div>
        ) : (
          <CommentList comments={comments} />
        )}
      </section>
    </div>
  );
}
