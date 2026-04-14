import UserAvatar from "@/shared/components/UserAvatar";
import type { WorkComment } from "@/lib/types";

export default function WorkCommentList({ comments }: { comments: WorkComment[] }) {
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <UserAvatar name={comment.author?.username || comment.authorId} size="sm" />
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {comment.author?.username || comment.authorId}
            </div>
            <div className="text-sm text-muted-foreground">{comment.content}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
