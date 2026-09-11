import { notFound } from "next/navigation";
import PostEditPageContent from "@/features/posts/components/PostEditPageContent";
import { serverFetch } from "@/lib/serverApi";
import type { PostListItem } from "@/lib/types";

export default async function PostEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await serverFetch<PostListItem>(`/posts/${id}`);

  if (!result?.data) {
    notFound();
  }

  return <PostEditPageContent initialPost={result.data} />;
}
