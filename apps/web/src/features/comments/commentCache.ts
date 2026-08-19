import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { BaseComment } from "@/lib/types";

export function prependCommentToCache<TComment extends BaseComment>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  comment: TComment,
  onCountChange?: (count: number) => void,
) {
  let nextCount = 0;

  queryClient.setQueryData<TComment[]>(queryKey, (current = []) => {
    const nextComments = [comment, ...current];
    nextCount = nextComments.length;
    onCountChange?.(nextComments.length);
    return nextComments;
  });

  return nextCount;
}

export function invalidateCommentRelatedQueries(
  queryClient: QueryClient,
  queryKey?: QueryKey,
) {
  if (!queryKey) {
    return;
  }

  queryClient.invalidateQueries({ queryKey });
}
