import { queryOptions } from "@tanstack/react-query";
import { fetchPost, type PostListItem } from "@/features/posts/services/postApi";
import { queryKeys } from "@/lib/queryKeys";

export function postDetailQueryOptions(
  postId: string,
  initialData?: PostListItem,
) {
  return queryOptions({
    queryKey: queryKeys.posts.detail(postId),
    queryFn: () => fetchPost(postId).then((result) => result.data),
    ...(initialData ? { initialData } : {}),
  });
}
