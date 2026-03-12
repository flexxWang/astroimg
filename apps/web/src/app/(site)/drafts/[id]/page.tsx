"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import PostEditor from "@/components/PostEditor";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/userStore";
import { fetchDraft, publishDraft, updateDraft } from "@/services/draftApi";
import { useToast } from "@/hooks/useToast";

export default function DraftEditPage() {
  const params = useParams();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { toast, hasToast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const draftId = params.id as string;

  useEffect(() => {
    if (!user) return;
    fetchDraft(draftId)
      .then((result) => {
        setTitle(result.data.title || "");
        setContent(result.data.content || "");
      })
      .catch((err) => {
        toast({
          title: "加载失败",
          description: (err as Error).message,
          variant: "destructive",
        });
      });
  }, [draftId, user, toast]);

  const handleSave = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      await updateDraft(draftId, { title, content });
      toast({ title: "草稿已保存" });
    } catch (err) {
      toast({
        title: "保存失败",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!title.trim() || !content.trim()) {
      if (!hasToast("请补全内容")) {
        toast({
          title: "请补全内容",
          description: "标题和正文不能为空。",
          variant: "destructive",
        });
      }
      return;
    }
    setLoading(true);
    try {
      const result = await publishDraft(draftId);
      router.push(`/post/${result.data.id}`);
    } catch (err) {
      toast({
        title: "发布失败",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="secondary">编辑草稿</Badge>
        <h1 className="text-2xl font-semibold">继续完善你的草稿</h1>
      </div>
      <div className="space-y-4 rounded-2xl border bg-white/80 p-6 shadow-sm">
        <Input
          placeholder="标题"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <PostEditor onChange={setContent} value={content} />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleSave}>
            保存草稿
          </Button>
          <Button onClick={handlePublish} disabled={loading}>
            {loading ? "发布中..." : "发布"}
          </Button>
        </div>
      </div>
    </div>
  );
}
