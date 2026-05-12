"use client";

import { useRouter } from "next/navigation";
import type { QueryKey } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import CommentForm from "@/features/comments/components/CommentForm";
import CommentList from "@/features/comments/components/CommentList";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import { getErrorMessage } from "@/lib/errorMessages";
import type { BaseComment } from "@/lib/types";

interface CommentsSectionProps<TComment extends BaseComment> {
  createComment: (content: string) => Promise<TComment>;
  emptyText?: string;
  errorFallback?: string;
  initialComments: TComment[];
  onCountChange?: (count: number) => void;
  queryFn: () => Promise<TComment[]>;
  queryKey: QueryKey;
  title?: string;
}

export default function CommentsSection<TComment extends BaseComment>({
  createComment,
  emptyText = "暂无评论",
  errorFallback = "评论失败，请稍后再试。",
  initialComments,
  onCountChange,
  queryFn,
  queryKey,
  title = "评论",
}: CommentsSectionProps<TComment>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  const { data: comments = [] } = useQuery({
    queryKey,
    queryFn,
    initialData: initialComments,
  });

  const createCommentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: (comment) => {
      queryClient.setQueryData<TComment[]>(queryKey, (current = []) => {
        const nextComments = [comment, ...current];
        onCountChange?.(nextComments.length);
        return nextComments;
      });
    },
  });

  const handleSubmit = async (content: string) => {
    if (!user) {
      router.push("/login");
      return false;
    }

    await createCommentMutation.mutateAsync(content);
    return true;
  };

  const error = createCommentMutation.isError
    ? getErrorMessage(createCommentMutation.error, errorFallback)
    : null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <CommentForm
        error={error}
        isSubmitting={createCommentMutation.isPending}
        onSubmit={handleSubmit}
      />
      {comments.length === 0 ? (
        <div className="text-sm text-muted-foreground">{emptyText}</div>
      ) : (
        <CommentList comments={comments} />
      )}
    </section>
  );
}
