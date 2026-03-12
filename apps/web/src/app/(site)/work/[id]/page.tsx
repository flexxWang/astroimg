import Link from "next/link";
import { notFound } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { serverFetch } from "@/lib/serverApi";
import type { WorkItem } from "@/lib/types";

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await serverFetch<{ success: boolean; data: WorkItem }>(
    `/works/${id}`,
  );

  if (!result?.data) {
    notFound();
  }

  const work = result.data;

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
    </div>
  );
}
