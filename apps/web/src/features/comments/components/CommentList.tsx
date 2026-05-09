import UserAvatar from "@/shared/components/UserAvatar";

export interface CommentItem {
  id: string;
  authorId: string;
  author?: {
    id: string;
    username?: string | null;
    avatarUrl?: string | null;
  };
  content: string;
  createdAt?: string;
}

export default function CommentList({ comments }: { comments: CommentItem[] }) {
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <UserAvatar
            name={comment.author?.username || comment.authorId}
            size="sm"
          />
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
