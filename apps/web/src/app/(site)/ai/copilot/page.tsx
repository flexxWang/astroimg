import AiCopilotClient from "@/features/ai/components/AiCopilotClient";
import { fetchInitialAiPlanHistory } from "@/features/ai/services/aiCopilotServer";

export default async function AiCopilotPage() {
  let initialHistoryPage;

  try {
    initialHistoryPage = await fetchInitialAiPlanHistory();
  } catch {
    initialHistoryPage = undefined;
  }

  return <AiCopilotClient initialHistoryPage={initialHistoryPage} />;
}
