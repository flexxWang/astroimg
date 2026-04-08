import { notFound } from "next/navigation";
import WorkDetailClient from "@/components/WorkDetailClient";
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

  return <WorkDetailClient work={work} comments={comments} images={images} />;
}
