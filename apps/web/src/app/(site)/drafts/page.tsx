"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { fetchDrafts, publishDraft } from "@/services/draftApi";
import { excerpt } from "@/lib/format";
import { useUserStore } from "@/stores/userStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { showApiErrorToast } from "@/lib/showApiErrorToast";

export default function DraftListPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const hydrated = useUserStore((state) => state.hydrated);

  const { data, isLoading } = useQuery({
    queryKey: ["drafts", user?.id],
    queryFn: () => fetchDrafts(),
    enabled: Boolean(user),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (hydrated && !user) {
      router.push("/login");
    }
  }, [hydrated, router, user]);

  if (!hydrated || !user) {
    return null;
  }

  const drafts = data?.data ?? [];

  const handlePublish = async (id: string) => {
    try {
      const result = await publishDraft(id);
      router.push(`/post/${result.data.id}`);
    } catch (err) {
      showApiErrorToast(err, {
        title: "发布失败",
        fallback: "发布失败，请稍后再试。",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">草稿箱</h1>
        <Link href="/post/create">
          <Button>新建草稿</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">加载中...</div>
      ) : drafts.length === 0 ? (
        <div className="text-sm text-muted-foreground">暂无草稿</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {drafts.map((draft) => (
            <Card key={draft.id} className="bg-white/70">
              <CardHeader>
                <div className="text-base font-semibold">
                  {draft.title || "未命名"}
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground line-clamp-2">
                {excerpt(draft.content || "")}
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <Link href={`/drafts/${draft.id}`} className="text-sm">
                  继续编辑
                </Link>
                <Button size="sm" onClick={() => handlePublish(draft.id)}>
                  直接发布
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
