"use client";

import CommentsSection from "@/features/comments/components/CommentsSection";
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
  return (
    <CommentsSection<WorkComment>
      queryKey={queryKeys.works.comments(workId)}
      initialComments={initialComments}
      queryFn={() => fetchWorkComments(workId).then((response) => response.data)}
      createComment={(content) =>
        createWorkComment(workId, { content }).then((response) => response.data)
      }
    />
  );
}
