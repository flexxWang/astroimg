"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { fetchDrafts, publishDraft } from "@/services/draftApi";
import { excerpt } from "@/lib/format";
import { useUserStore } from "@/stores/userStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";

export default function DraftListPage() {
  const router = useRouter();
  const token = useUserStore((state) => state.token);
  const hydrated = useUserStore((state) => state.hydrated);
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["drafts", token],
    queryFn: () => fetchDrafts(token!),
    enabled: Boolean(token),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (hydrated && !token) {
      router.push("/login");
    }
  }, [hydrated, router, token]);

  if (!hydrated || !token) {
    return null;
  }

  const drafts = data?.data ?? [];

  const handlePublish = async (id: string) => {
    try {
      const result = await publishDraft(token, id);
      router.push(`/post/${result.data.id}`);
    } catch (err) {
      toast({
        title: "发布失败",
        description: (err as Error).message,
        variant: "destructive",
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
