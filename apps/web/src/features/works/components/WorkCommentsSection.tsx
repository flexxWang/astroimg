"use client";

import { useQueryClient } from "@tanstack/react-query";
import CommentsSection from "@/features/comments/components/CommentsSection";
import { syncWorkCommentCount } from "@/features/works/workCache";
import {
  createWorkComment,
  fetchWorkComments,
} from "@/features/works/services/workCommentApi";
import { queryKeys } from "@/lib/queryKeys";
import type { WorkComment } from "@/lib/types";

export default function WorkCommentsSection({
  initialComments,
  workId,
}: {
  initialComments: WorkComment[];
  workId: string;
}) {
  const queryClient = useQueryClient();

  return (
    <CommentsSection<WorkComment>
      queryKey={queryKeys.works.comments(workId)}
      initialComments={initialComments}
      onCommentCreated={(_, nextCount) => {
        syncWorkCommentCount(queryClient, workId, nextCount);
      }}
      queryFn={() => fetchWorkComments(workId).then((response) => response.data)}
      createComment={(content) =>
        createWorkComment(workId, { content }).then((response) => response.data)
      }
    />
  );
}
