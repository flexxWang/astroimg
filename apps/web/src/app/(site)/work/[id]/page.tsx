import { notFound } from "next/navigation";
import WorkDetailContent from "@/features/works/components/WorkDetailContent";
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

  return (
    <WorkDetailContent
      initialComments={comments}
      initialWork={work}
      workId={id}
    />
  );
}
