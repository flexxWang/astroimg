"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Clock3, FileText, PenLine, Plus, Send } from "lucide-react";
import { removeDraftFromCache } from "@/features/drafts/draftCache";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import { fetchDrafts, publishDraft } from "@/features/drafts/services/draftApi";
import ContentThumbnail from "@/shared/components/ContentThumbnail";
import { excerpt, firstImageSrc } from "@/lib/format";
import { queryKeys } from "@/lib/queryKeys";
import { Button } from "@/components/ui/button";

function formatDraftDate(value?: string) {
  if (!value) return "刚刚更新";
  return `${new Date(value).toLocaleDateString()} 更新`;
}

export default function DraftListPage() {
  const router = useRouter();
  const { authBootstrapComplete, user } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.drafts.list(user?.id),
    queryFn: () => fetchDrafts(),
    enabled: Boolean(user),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (authBootstrapComplete && !user) {
      router.push("/login");
    }
  }, [authBootstrapComplete, router, user]);

  if (!authBootstrapComplete || !user) {
    return null;
  }

  const drafts = data?.data ?? [];

  const handlePublish = async (id: string) => {
    try {
      const result = await publishDraft(id);
      removeDraftFromCache(queryClient, user?.id, id);
      router.push(`/post/${result.data.id}`);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">草稿箱</h1>
          <p className="text-sm text-muted-foreground">
            管理尚未发布的观测记录和创作想法
          </p>
        </div>
        <Link href="/post/create">
          <Button className="gap-1.5">
            <Plus className="size-4" />
            新建草稿
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="border-y bg-white/70 px-5 py-12 text-center text-sm text-muted-foreground backdrop-blur">
          加载中...
        </div>
      ) : drafts.length === 0 ? (
        <div className="border-y bg-white/70 px-5 py-12 text-center text-sm text-muted-foreground backdrop-blur">
          暂无草稿
        </div>
      ) : (
        <section className="overflow-hidden border-y bg-white/78 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="size-4 text-blue-500" />
              <span>草稿列表</span>
            </div>
            <span className="text-xs text-muted-foreground">
              共 {drafts.length} 篇
            </span>
          </div>

          <ol className="divide-y">
            {drafts.map((draft) => (
              <li key={draft.id} className="group">
                <div className="grid gap-4 px-4 py-4 transition hover:bg-slate-50/90 sm:grid-cols-[minmax(0,1fr)_8.5rem] sm:px-5">
                  <div className="min-w-0 space-y-2">
                    <Link
                      href={`/drafts/${draft.id}`}
                      className="block min-w-0 text-base font-semibold leading-snug hover:text-blue-600 sm:text-lg"
                    >
                      {draft.title || "未命名"}
                    </Link>
                    <Link
                      href={`/drafts/${draft.id}`}
                      className="block text-sm leading-6 text-muted-foreground line-clamp-2 group-hover:text-slate-600"
                    >
                      {excerpt(draft.content || "", 104) || "还没有正文内容"}
                    </Link>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-3.5" />
                        {formatDraftDate(draft.updatedAt ?? draft.createdAt)}
                      </span>
                      <span>草稿</span>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-auto gap-1 rounded-none px-0 py-0 text-xs text-blue-600 hover:bg-transparent hover:text-blue-700"
                      >
                        <Link href={`/drafts/${draft.id}`}>
                          <PenLine className="size-3.5" />
                          继续编辑
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 gap-1 px-2.5 text-xs"
                        onClick={() => handlePublish(draft.id)}
                      >
                        <Send className="size-3.5" />
                        直接发布
                      </Button>
                    </div>
                  </div>

                  <ContentThumbnail
                    href={`/drafts/${draft.id}`}
                    src={firstImageSrc(draft.content || "")}
                    alt={draft.title || "草稿图片"}
                    className="sm:mt-1"
                  />
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
