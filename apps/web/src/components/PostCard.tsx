import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/components/UserAvatar";
import { excerpt } from "@/lib/format";

interface PostCardProps {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  tag?: string;
  likeCount?: number;
  commentCount?: number;
}

export default function PostCard({
  id,
  title,
  excerpt: raw,
  author,
  tag,
  likeCount,
  commentCount,
}: PostCardProps) {
  return (
    <Card className="bg-white/60 backdrop-blur">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-2">
          <Link href={`/post/${id}`} className="text-lg font-semibold hover:underline">
            {title}
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-2">{excerpt(raw)}</p>
        </div>
        {tag ? <Badge variant="secondary">{tag}</Badge> : null}
      </CardHeader>
      <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
        <UserAvatar name={author} size="sm" />
        <span>{author}</span>
      </CardContent>
      <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
        <span>刚刚</span>
        <div className="flex items-center gap-3">
          <span>点赞 {likeCount ?? 0}</span>
          <span>评论 {commentCount ?? 0}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
