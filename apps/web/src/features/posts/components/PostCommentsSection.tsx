"use client";

import CommentsSection from "@/features/comments/components/CommentsSection";
import {
  createComment,
  fetchComments,
  type CommentItem,
} from "@/features/comments/services/commentApi";
import { queryKeys } from "@/lib/queryKeys";

export default function PostCommentsSection({
  initialComments,
  postId,
}: {
  initialComments: CommentItem[];
  postId: string;
}) {
  return (
    <CommentsSection<CommentItem>
      queryKey={queryKeys.posts.comments(postId)}
      initialComments={initialComments}
      queryFn={() => fetchComments(postId).then((response) => response.data)}
      createComment={(content) =>
        createComment(postId, { content }).then((response) => response.data)
      }
    />
  );
}
