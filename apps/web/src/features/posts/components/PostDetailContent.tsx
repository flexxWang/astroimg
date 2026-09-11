"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { CommentItem } from "@/features/comments/services/commentApi";
import FollowButton from "@/features/follows/components/FollowButton";
import LikeButton from "@/features/posts/components/LikeButton";
import PostCommentsSection from "@/features/posts/components/PostCommentsSection";
import PostEditLink from "@/features/posts/components/PostEditLink";
import { postDetailQueryOptions } from "@/features/posts/queries/postDetailQuery";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { sanitizeHtml } from "@/lib/sanitize";
import type { PostListItem } from "@/lib/types";
import UserAvatar from "@/shared/components/UserAvatar";

export default function PostDetailContent({
  initialComments,
  initialPost,
  postId,
}: {
  initialComments: CommentItem[];
  initialPost: PostListItem;
  postId: string;
}) {
  const { data } = useQuery(postDetailQueryOptions(postId, initialPost));
  const { user } = useCurrentUser();
  const post = data ?? initialPost;
  const safeContent = sanitizeHtml(post.content);
  const isOwner = user?.id === post.authorId;

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
                {post.createdAt
                  ? new Date(post.createdAt).toLocaleDateString()
                  : ""}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwner ? (
              <PostEditLink postId={post.id} />
            ) : (
              <>
                <FollowButton userId={post.authorId} />
                <Link href={`/messages?to=${post.authorId}`}>
                  <Button variant="secondary" size="sm">
                    私信
                  </Button>
                </Link>
              </>
            )}
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
      <PostCommentsSection postId={postId} initialComments={initialComments} />
    </div>
  );
}
