import AiCopilotClient from "@/components/AiCopilotClient";
import { fetchInitialAiPlanHistory } from "@/services/aiCopilotServer";

export default async function AiCopilotPage() {
  let initialHistoryPage;

  try {
    initialHistoryPage = await fetchInitialAiPlanHistory();
  } catch {
    initialHistoryPage = undefined;
  }

  return <AiCopilotClient initialHistoryPage={initialHistoryPage} />;
}
