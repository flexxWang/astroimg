"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import StreamPlanSections from "@/components/StreamPlanSections";
import { useToast } from "@/hooks/useToast";
import { createDraft } from "@/services/draftApi";
import { useUserStore } from "@/stores/userStore";
import {
  deleteAiPlanHistory,
  fetchAiPlanHistory,
  streamAiPlan,
} from "@/services/aiCopilotApi";
import type {
  AiCopilotInput,
  AiPlanHistoryItem,
  AiCopilotPlan,
  AiCopilotStreamStatus,
  Paginated,
} from "@/lib/types";

const defaultInput = (): AiCopilotInput => {
  const now = new Date();
  const start = new Date(now.getTime() + 60 * 60 * 1000);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return {
    locationName: "",
    deviceType: "天文望远镜",
    deviceModel: "",
    startTime: start.toISOString().slice(0, 16),
    endTime: end.toISOString().slice(0, 16),
    preference: "mixed",
    level: "intermediate",
    availableMinutes: 120,
  };
};

interface AiCopilotClientProps {
  initialHistoryPage?: Paginated<AiPlanHistoryItem>;
}

export default function AiCopilotClient({
  initialHistoryPage,
}: AiCopilotClientProps) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { toast } = useToast();
  const [input, setInput] = useState<AiCopilotInput>(defaultInput());
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AiPlanHistoryItem | null>(null);
  const [plan, setPlan] = useState<AiCopilotPlan | null>(null);
  const [streamText, setStreamText] = useState("");
  const [streamStatus, setStreamStatus] = useState<AiCopilotStreamStatus | null>(
    null,
  );
  const pendingPlanRef = useRef<AiCopilotPlan | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const historyScrollRef = useRef<HTMLDivElement | null>(null);
  const historySentinelRef = useRef<HTMLDivElement | null>(null);

  const {
    data: historyData,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching: isHistoryFetching,
  } = useInfiniteQuery({
    queryKey: ["ai-copilot-history"],
    queryFn: ({ pageParam = 1 }) =>
      fetchAiPlanHistory(pageParam, 10).then((res) => res.data),
    enabled: Boolean(user),
    initialPageParam: 1,
    initialData: initialHistoryPage
      ? {
          pages: [initialHistoryPage],
          pageParams: [1],
        }
      : undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
  });

  const history = useMemo(
    () =>
      (historyData?.pages ?? []).flatMap(
        (page) => page.items,
      ) as AiPlanHistoryItem[],
    [historyData?.pages],
  );

  const canSubmit = useMemo(() => {
    return Boolean(
      input.locationName.trim() &&
      input.deviceType.trim() &&
      input.startTime &&
      input.endTime,
    );
  }, [input]);

  useEffect(() => {
    const root = historyScrollRef.current;
    const target = historySentinelRef.current;

    if (!root || !target || !hasNextPage || isFetchingNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || !hasNextPage || isFetchingNextPage) {
          return;
        }
        fetchNextPage().catch(() => {
          toast({
            title: "加载历史失败",
            description: "历史计划加载失败，请稍后再试。",
            variant: "destructive",
          });
        });
      },
      {
        root,
        rootMargin: "120px",
        threshold: 0.1,
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, toast]);

  const providerLabel = (provider?: AiCopilotPlan["provider"]) => {
    if (provider === "openai" || provider === "openrouter") {
      return "真实模型";
    }
    return "规则兜底";
  };

  const formatFallbackReason = (reason?: string) => {
    if (!reason) {
      return "模型调用失败，已切换到规则兜底。";
    }

    if (reason.includes("429") || reason.toLowerCase().includes("rate-limit")) {
      return "免费模型当前限流，已自动切换到规则兜底。";
    }

    if (reason.toLowerCase().includes("could not decode header")) {
      return "上游流式响应异常，已自动切换到规则兜底。";
    }

    if (reason.toLowerCase().includes("stream failed")) {
      return "模型流式生成失败，已自动切换到规则兜底。";
    }

    return `模型调用异常，已切换到规则兜底：${reason}`;
  };

  const showStreamingPanel = loading && !plan;

  const escapeHtml = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const buildDraftContent = (currentPlan: AiCopilotPlan) => {
    const points = currentPlan.recommendedPoints
      .map(
        (point) =>
          `<li><p><strong>${escapeHtml(point.name)}</strong>：${escapeHtml(point.reason)}</p></li>`,
      )
      .join("");
    const targets = currentPlan.targets
      .map(
        (target) =>
          `<li><p><strong>${escapeHtml(target.name)}</strong>：${escapeHtml(
            target.reason,
          )}</p><p>${escapeHtml(target.settings)}</p></li>`,
      )
      .join("");
    const checklist = currentPlan.checklist
      .map((item) => `<li><p>${escapeHtml(item)}</p></li>`)
      .join("");
    const risks = currentPlan.risks
      .map((item) => `<li><p>${escapeHtml(item)}</p></li>`)
      .join("");

    return [
      `<p>${escapeHtml(currentPlan.summary)}</p>`,
      "<h2>推荐观测点</h2>",
      `<ul>${points}</ul>`,
      "<h2>推荐目标</h2>",
      `<ul>${targets}</ul>`,
      "<h2>执行清单</h2>",
      `<ul>${checklist}</ul>`,
      "<h2>风险提示</h2>",
      `<ul>${risks}</ul>`,
    ].join("");
  };

  const resetStreamingState = () => {
    setStreamText("");
    setStreamStatus(null);
    pendingPlanRef.current = null;
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    resetStreamingState();
    setLoading(false);
    toast({
      title: "已取消生成",
      description: "本次 AI 观测计划已停止生成。",
    });
  };

  const handleSaveDraft = async () => {
    if (!plan) {
      return;
    }

    setSavingDraft(true);
    try {
      const result = await createDraft({
        title: plan.title,
        content: buildDraftContent(plan),
      });
      toast({
        title: "草稿已保存",
        description: "已保存到草稿箱，你可以继续编辑后再发布。",
      });
      router.push(`/drafts/${result.data.id}`);
    } catch (err) {
      toast({
        title: "保存草稿失败",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setSavingDraft(false);
    }
  };

  const handleDeleteHistory = async () => {
    if (!pendingDelete) {
      return;
    }

    const id = pendingDelete.id;
    setDeletingId(id);
    try {
      await deleteAiPlanHistory(id);
      if (plan?.id === id) {
        setPlan(null);
      }
      await refetch();
      setPendingDelete(null);
      toast({
        title: "已删除",
        description: "这条观测计划已经从历史中移除。",
      });
    } catch (err) {
      toast({
        title: "删除失败",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!canSubmit) {
      toast({
        title: "请补全参数",
        description: "地点、设备、开始时间、结束时间为必填。",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setPlan(null);
    pendingPlanRef.current = null;
    setStreamText("");
    setStreamStatus({ stage: "started" });
    abortRef.current = new AbortController();
    try {
      const payload: AiCopilotInput = {
        ...input,
        startTime: new Date(input.startTime).toISOString(),
        endTime: new Date(input.endTime).toISOString(),
      };
      await streamAiPlan(payload, {
        onStatus: (status) => {
          setStreamStatus(status);
          if (status.stage === "fallback") {
            toast({
              title: "已切换兜底",
              description: formatFallbackReason(status.reason),
              variant: "destructive",
            });
          }
        },
        onDelta: (text) => {
          setStreamText((prev) => prev + text);
        },
        onResult: (result) => {
          pendingPlanRef.current = result;
        },
        onError: (message) => {
          toast({
            title: "流式生成失败",
            description: message,
            variant: "destructive",
          });
        },
        onDone: () => {
          if (pendingPlanRef.current) {
            setPlan(pendingPlanRef.current);
            pendingPlanRef.current = null;
            setStreamStatus(null);
            setStreamText("");
            refetch();
          }
        },
      }, { signal: abortRef.current.signal });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        return;
      }
      toast({
        title: "生成失败",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">AI 观测副驾</h1>
        <p className="text-sm text-muted-foreground">
          输入地点、设备和时间，生成今晚可执行的观测计划。
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <section className="space-y-4 rounded-2xl border bg-white/80 p-5 shadow-sm">
          <h2 className="text-base font-semibold">计划输入</h2>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">地点</label>
            <Input
              value={input.locationName}
              onChange={(e) =>
                setInput((prev) => ({ ...prev, locationName: e.target.value }))
              }
              placeholder="例如：上海崇明东滩"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">设备类型</label>
            <Input
              value={input.deviceType}
              onChange={(e) =>
                setInput((prev) => ({ ...prev, deviceType: e.target.value }))
              }
              placeholder="天文望远镜 / 双筒 / 相机"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">设备型号（可选）</label>
            <Input
              value={input.deviceModel ?? ""}
              onChange={(e) =>
                setInput((prev) => ({ ...prev, deviceModel: e.target.value }))
              }
              placeholder="Seestar S50 / C8 等"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">开始时间</label>
              <Input
                type="datetime-local"
                value={input.startTime.slice(0, 16)}
                onChange={(e) =>
                  setInput((prev) => ({ ...prev, startTime: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">结束时间</label>
              <Input
                type="datetime-local"
                value={input.endTime.slice(0, 16)}
                onChange={(e) =>
                  setInput((prev) => ({ ...prev, endTime: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">偏好目标</label>
              <select
                className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
                value={input.preference}
                onChange={(e) =>
                  setInput((prev) => ({
                    ...prev,
                    preference: e.target.value as AiCopilotInput["preference"],
                  }))
                }
              >
                <option value="mixed">综合</option>
                <option value="moon">月面</option>
                <option value="planet">行星</option>
                <option value="deep-sky">深空</option>
                <option value="wide-field">广域</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">经验水平</label>
              <select
                className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
                value={input.level}
                onChange={(e) =>
                  setInput((prev) => ({
                    ...prev,
                    level: e.target.value as AiCopilotInput["level"],
                  }))
                }
              >
                <option value="beginner">新手</option>
                <option value="intermediate">进阶</option>
                <option value="advanced">老手</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">可用时长（分钟）</label>
            <Input
              type="number"
              min={15}
              value={input.availableMinutes ?? 120}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  availableMinutes: Number(e.target.value || 120),
                }))
              }
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={loading || !canSubmit}
            className="w-full"
          >
            {loading ? "生成中..." : "生成观测计划"}
          </Button>
          {loading ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="w-full"
            >
              取消生成
            </Button>
          ) : null}
        </section>

        <section className="space-y-4">
          {showStreamingPanel && (
            <div className="rounded-2xl border bg-white/80 p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold">实时生成中</h2>
                {streamStatus ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
                    {streamStatus.stage === "streaming"
                      ? "模型流式输出"
                      : streamStatus.stage === "fallback"
                        ? "已切换兜底"
                        : streamStatus.stage === "saving"
                          ? "保存结果中"
                          : "准备生成"}
                  </span>
                ) : null}
                {streamStatus?.model ? (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] text-amber-700">
                    {streamStatus.model}
                  </span>
                ) : null}
              </div>
              <StreamPlanSections rawText={streamText} isStreaming={loading} />
            </div>
          )}

          <div className="rounded-2xl border bg-white/80 p-5 shadow-sm">
            {!plan ? (
              <div className="text-sm text-muted-foreground">
                还没有计划，先在左侧输入参数并生成。
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{plan.title}</h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
                      {providerLabel(plan.provider)}
                    </span>
                    {plan.model ? (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] text-amber-700">
                        {plan.model}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.summary}</p>
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={savingDraft}
                    >
                      {savingDraft ? "保存中..." : "保存为草稿"}
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {plan.targets.map((target) => (
                    <div key={target.name} className="rounded-xl border bg-white p-3">
                      <div className="text-sm font-medium">{target.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {target.reason}
                      </div>
                      <div className="mt-1 text-xs">{target.settings}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        匹配分：{target.score}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border bg-white p-3">
                    <div className="text-sm font-medium">执行清单</div>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {plan.checklist.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border bg-white p-3">
                    <div className="text-sm font-medium">风险提示</div>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {plan.risks.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-white/80 p-5 shadow-sm">
            <h3 className="text-base font-semibold">历史计划</h3>
            {history.length === 0 && isHistoryFetching ? (
              <div className="mt-2 text-sm text-muted-foreground">历史计划加载中...</div>
            ) : history.length === 0 ? (
              <div className="mt-2 text-sm text-muted-foreground">暂无历史计划</div>
            ) : (
              <div
                ref={historyScrollRef}
                className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1"
              >
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-xl border bg-white px-3 py-2"
                  >
                    <button
                      className="min-w-0 flex-1 text-left transition hover:bg-slate-50"
                      onClick={() =>
                        setPlan({
                          id: item.id,
                          createdAt: item.createdAt,
                          ...item.output,
                        } as AiCopilotPlan)
                      }
                    >
                      <div className="truncate text-sm font-medium">
                        {item.output.title}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString()
                          : "刚刚"}
                      </div>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-slate-500 hover:text-red-500"
                      disabled={deletingId === item.id}
                      onClick={() => setPendingDelete(item)}
                    >
                      {deletingId === item.id ? "删除中..." : "删除"}
                    </Button>
                  </div>
                ))}
                <div ref={historySentinelRef} className="h-1" />
                {isFetchingNextPage ? (
                  <div className="pb-1 text-center text-xs text-muted-foreground">
                    加载更多历史中...
                  </div>
                ) : null}
                {!hasNextPage && history.length > 0 ? (
                  <div className="pb-1 text-center text-xs text-muted-foreground">
                    没有更多历史了
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>
      </div>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="删除观测计划"
        description={
          pendingDelete
            ? `确认删除「${pendingDelete.output.title}」吗？删除后将无法恢复。`
            : undefined
        }
        confirmText="确认删除"
        cancelText="再想想"
        loading={Boolean(deletingId)}
        onCancel={() => {
          if (!deletingId) {
            setPendingDelete(null);
          }
        }}
        onConfirm={() => void handleDeleteHistory()}
      />
    </div>
  );
}
