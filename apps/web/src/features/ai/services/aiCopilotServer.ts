import { serverFetch } from "@/lib/serverApi";
import type { AiPlanHistoryItem, Paginated } from "@/lib/types";

export async function fetchInitialAiPlanHistory(page = 1, pageSize = 10) {
  const result = await serverFetch<Paginated<AiPlanHistoryItem>>(
    `/ai/copilot/history?page=${page}&pageSize=${pageSize}`,
  );

  return result.data;
}
