"use client";

import CommentsSection from "@/features/comments/components/CommentsSection";
import { syncPostCommentCount } from "@/features/posts/postCache";
import {
  createComment,
  fetchComments,
  type CommentItem,
} from "@/features/comments/services/commentApi";
import { queryKeys } from "@/lib/queryKeys";
import { useQueryClient } from "@tanstack/react-query";

export default function PostCommentsSection({
  initialComments,
  postId,
}: {
  initialComments: CommentItem[];
  postId: string;
}) {
  const queryClient = useQueryClient();

  return (
    <CommentsSection<CommentItem>
      queryKey={queryKeys.posts.comments(postId)}
      initialComments={initialComments}
      onCommentCreated={(_, nextCount) => {
        syncPostCommentCount(queryClient, postId, nextCount);
      }}
      queryFn={() => fetchComments(postId).then((response) => response.data)}
      createComment={(content) =>
        createComment(postId, { content }).then((response) => response.data)
      }
    />
  );
}
