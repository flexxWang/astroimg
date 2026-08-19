import { queryOptions } from "@tanstack/react-query";
import { fetchWork } from "@/features/works/services/workApi";
import { queryKeys } from "@/lib/queryKeys";
import type { WorkItem } from "@/lib/types";

export function workDetailQueryOptions(
  workId: string,
  initialData?: WorkItem,
) {
  return queryOptions({
    queryKey: queryKeys.works.detail(workId),
    queryFn: () => fetchWork(workId).then((result) => result.data),
    ...(initialData ? { initialData } : {}),
  });
}
