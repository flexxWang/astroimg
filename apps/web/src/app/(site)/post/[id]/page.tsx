import { notFound } from "next/navigation";
import type { CommentItem } from "@/features/comments/services/commentApi";
import PostDetailContent from "@/features/posts/components/PostDetailContent";
import { serverFetch } from "@/lib/serverApi";
import type { PostListItem } from "@/lib/types";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await serverFetch<PostListItem>(`/posts/${id}`);
  const commentResult = await serverFetch<CommentItem[]>(
    `/posts/${id}/comments`,
  );

  if (!result?.data) {
    notFound();
  }

  const post = result.data;
  const comments = commentResult.data ?? [];

  return (
    <PostDetailContent
      initialComments={comments}
      initialPost={post}
      postId={id}
    />
  );
}
