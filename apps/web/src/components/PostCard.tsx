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
  authorId: string;
  tag?: string;
  likeCount?: number;
  commentCount?: number;
  highlight?: string;
}

export default function PostCard({
  id,
  title,
  excerpt: raw,
  author,
  authorId,
  tag,
  likeCount,
  commentCount,
  highlight,
}: PostCardProps) {
  const highlightText = (text: string, keyword?: string) => {
    const value = keyword?.trim();
    if (!value) return text;
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "gi");
    const parts = text.split(regex);
    if (parts.length === 1) return text;
    const matches = text.match(regex) ?? [];
    return parts.flatMap((part, index) => {
      const match = matches[index];
      return match
        ? [
            part,
            <mark key={`${match}-${index}`} className="rounded bg-amber-200/70 px-0.5">
              {match}
            </mark>,
          ]
        : [part];
    });
  };

  return (
    <Card className="bg-white/60 backdrop-blur">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-2">
          <Link href={`/post/${id}`} className="text-lg font-semibold hover:underline">
            {highlightText(title, highlight)}
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {highlightText(excerpt(raw), highlight)}
          </p>
        </div>
        {tag ? <Badge variant="secondary">{tag}</Badge> : null}
      </CardHeader>
      <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
        <Link href={`/user/${authorId}`} className="flex items-center gap-2 hover:text-foreground">
          <UserAvatar name={author} size="sm" />
          <span>{author}</span>
        </Link>
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
