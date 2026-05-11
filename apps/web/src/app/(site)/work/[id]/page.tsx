import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/shared/components/UserAvatar";
import WorkLikeButton from "@/features/works/components/WorkLikeButton";
import WorkCommentsSection from "@/features/works/components/WorkCommentsSection";
import WorkMediaGallery from "@/features/works/components/WorkMediaGallery";
import { serverFetch } from "@/lib/serverApi";
import type { WorkComment, WorkItem } from "@/lib/types";

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await serverFetch<WorkItem>(`/works/${id}`);
  const commentResult = await serverFetch<WorkComment[]>(
    `/works/${id}/comments`,
  );

  if (!result?.data) {
    notFound();
  }

  const work = result.data;
  const comments = commentResult.data ?? [];

  const images = work.imageUrls?.length
    ? work.imageUrls
    : work.imageUrl
      ? [work.imageUrl]
      : [];

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Badge variant="secondary">作品</Badge>
        <h1 className="text-3xl font-semibold">{work.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Link
            href={`/user/${work.authorId}`}
            className="flex items-center gap-2 hover:text-foreground"
          >
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

      <WorkMediaGallery
        images={images}
        title={work.title}
        videoUrl={work.videoUrl}
      />

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

      <WorkCommentsSection workId={work.id} initialComments={comments} />
    </div>
  );
}
