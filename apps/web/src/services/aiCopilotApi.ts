import {
  createRequestError,
  parseApiErrorMessage,
  type ApiErrorPayload,
} from "@/lib/apiResponse";
import { apiFetch, API_BASE } from "@/services/api";
import type {
  AiCopilotInput,
  AiPlanHistoryItem,
  AiCopilotPlan,
  AiCopilotStreamStatus,
  Paginated,
} from "@/lib/types";

export function createAiPlan(payload: AiCopilotInput) {
  return apiFetch<AiCopilotPlan>("/ai/copilot/plan", {
    method: "POST",
    body: payload,
    errorToast: {
      title: "生成失败",
      fallback: "生成失败，请稍后再试。",
    },
  });
}

export function fetchAiPlanHistory(page = 1, pageSize = 10) {
  return apiFetch<Paginated<AiPlanHistoryItem>>(
    `/ai/copilot/history?page=${page}&pageSize=${pageSize}`,
  );
}

export function deleteAiPlanHistory(id: string) {
  return apiFetch<{ id: string }>(`/ai/copilot/history/${id}`, {
    method: "DELETE",
    errorToast: {
      title: "删除失败",
      fallback: "删除失败，请稍后再试。",
    },
  });
}

type StreamHandlers = {
  onStatus?: (status: AiCopilotStreamStatus) => void;
  onDelta?: (text: string) => void;
  onResult?: (plan: AiCopilotPlan) => void;
  onError?: (message: string) => void;
  onDone?: (payload: { ok?: boolean }) => void;
};

function parseSseChunk(raw: string, handlers: StreamHandlers) {
  let event = "message";
  const dataLines: string[] = [];

  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim() || "message";
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) {
    return;
  }

  const payload = JSON.parse(dataLines.join("\n"));

  if (event === "status") {
    handlers.onStatus?.(payload as AiCopilotStreamStatus);
  } else if (event === "delta") {
    handlers.onDelta?.(String(payload?.text ?? ""));
  } else if (event === "result") {
    handlers.onResult?.(payload as AiCopilotPlan);
  } else if (event === "error") {
    handlers.onError?.(
      parseApiErrorMessage(
        payload as ApiErrorPayload | string | null,
        "流式生成失败",
      ),
    );
  } else if (event === "done") {
    handlers.onDone?.(payload as { ok?: boolean });
  }
}

export async function streamAiPlan(
  payload: AiCopilotInput,
  handlers: StreamHandlers,
  options?: { signal?: AbortSignal },
) {
  const response = await fetch(`${API_BASE}/ai/copilot/plan/stream`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(payload),
    signal: options?.signal,
  });

  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      const text = await response.text();
      payload = text || null;
    }
    throw createRequestError(
      typeof payload === "string"
        ? payload
        : (payload as ApiErrorPayload | null),
      "流式生成失败",
      response.status,
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw createRequestError(null, "流式响应为空", response.status);
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    while (true) {
      const separatorMatch = buffer.match(/\r?\n\r?\n/);
      if (!separatorMatch || separatorMatch.index === undefined) {
        break;
      }

      const idx = separatorMatch.index;
      const separatorLength = separatorMatch[0].length;
      const chunk = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + separatorLength);

      if (chunk) {
        parseSseChunk(chunk, handlers);
      }
    }
  }
}
