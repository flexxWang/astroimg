import Link from "next/link";
import { notFound } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import WorkLikeButton from "@/components/WorkLikeButton";
import WorkCommentForm from "@/components/WorkCommentForm";
import WorkCommentList from "@/components/WorkCommentList";
import { serverFetch } from "@/lib/serverApi";
import type { WorkComment, WorkItem } from "@/lib/types";

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await serverFetch<{ success: boolean; data: WorkItem }>(
    `/works/${id}`,
  );
  const commentResult = await serverFetch<{ success: boolean; data: WorkComment[] }>(
    `/works/${id}/comments`,
  );

  if (!result?.data) {
    notFound();
  }

  const work = result.data;
  const comments = commentResult.data ?? [];

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Badge variant="secondary">作品</Badge>
        <h1 className="text-3xl font-semibold">{work.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Link href={`/user/${work.authorId}`} className="flex items-center gap-2 hover:text-foreground">
            <UserAvatar name={work.author?.username || work.authorId} size="sm" />
            <span>{work.author?.username || work.authorId}</span>
          </Link>
          {work.type?.name ? <span>· {work.type.name}</span> : null}
          {work.device?.name ? <span>· {work.device.name}</span> : null}
          {work.createdAt ? (
            <span>· {new Date(work.createdAt).toLocaleDateString()}</span>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-white/80 shadow-sm">
        <img src={work.imageUrl} alt={work.title} className="w-full object-cover" />
      </div>

      {work.description ? (
        <div className="rounded-2xl border bg-white/80 p-6 text-sm text-muted-foreground shadow-sm">
          {work.description}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <WorkLikeButton workId={work.id} initialCount={work.likeCount ?? 0} />
        <span className="text-sm text-muted-foreground">
          评论 {work.commentCount ?? comments.length}
        </span>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">评论</h2>
        <WorkCommentForm workId={id} />
        {comments.length === 0 ? (
          <div className="text-sm text-muted-foreground">暂无评论</div>
        ) : (
          <WorkCommentList comments={comments} />
        )}
      </section>
    </div>
  );
}
