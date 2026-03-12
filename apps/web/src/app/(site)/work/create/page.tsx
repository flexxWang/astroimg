"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/userStore";
import { useToast } from "@/hooks/useToast";
import { createWork, fetchWorkDevices, fetchWorkTypes } from "@/services/workApi";
import { signUpload, uploadFile } from "@/services/uploadApi";

export default function CreateWorkPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { toast, hasToast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [typeId, setTypeId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const { data: typesData } = useQuery({
    queryKey: ["work-types"],
    queryFn: fetchWorkTypes,
  });
  const { data: devicesData } = useQuery({
    queryKey: ["work-devices"],
    queryFn: fetchWorkDevices,
  });

  const types = typesData?.data ?? [];
  const devices = devicesData?.data ?? [];

  const canPublish = useMemo(
    () => Boolean(title.trim() && imageUrl && typeId && deviceId),
    [deviceId, imageUrl, title, typeId],
  );

  const handleSelectFile = async (file?: File | null) => {
    if (!file) return;
    if (!user) {
      router.push("/login");
      return;
    }
    setUploading(true);
    try {
      const sign = await signUpload(file.name, file.type);
      await uploadFile(sign.data.uploadUrl, file);
      setImageUrl(sign.data.fileUrl);
      toast({ title: "作品图已上传" });
    } catch (err) {
      toast({
        title: "上传失败",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!canPublish) {
      if (!hasToast("请补全作品信息")) {
        toast({
          title: "请补全作品信息",
          description: "标题、作品图、类型、设备为必填项。",
          variant: "destructive",
        });
      }
      return;
    }
    setPublishing(true);
    try {
      await createWork({
        title: title.trim(),
        description: description.trim() || undefined,
        imageUrl,
        typeId,
        deviceId,
      });
      router.push("/");
    } catch (err) {
      toast({
        title: "发布失败",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-144px)] flex-col space-y-6">
      <div className="space-y-2">
        <Badge variant="secondary">发布作品</Badge>
        <h1 className="text-2xl font-semibold">展示你的星空影像</h1>
        <p className="text-sm text-muted-foreground">
          作品图会展示在首页瀑布流，建议上传清晰的 JPG/PNG。
        </p>
      </div>
      <div className="flex h-full flex-1 flex-col space-y-4 rounded-2xl border bg-white/80 p-6 shadow-sm min-h-0">
        <Input
          placeholder="作品标题"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Textarea
          placeholder="简单描述一下拍摄目标、拍摄过程或心得（可选）"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-[120px]"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">作品类型</label>
            <select
              value={typeId}
              onChange={(event) => setTypeId(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
            >
              <option value="">请选择类型</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">拍摄设备</label>
            <select
              value={deviceId}
              onChange={(event) => setDeviceId(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
            >
              <option value="">请选择设备</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">作品图</label>
          {imageUrl ? (
            <div className="relative overflow-hidden rounded-2xl border">
              <img src={imageUrl} alt="作品预览" className="h-[360px] w-full object-cover" />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute right-3 top-3"
                onClick={() => setImageUrl("")}
              >
                重新上传
              </Button>
            </div>
          ) : (
            <label className="flex h-[220px] cursor-pointer items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground hover:bg-slate-50">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleSelectFile(event.target.files?.[0])}
              />
              {uploading ? "上传中..." : "点击上传作品图"}
            </label>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button onClick={handlePublish} disabled={publishing || uploading || !canPublish}>
            {publishing ? "发布中..." : "发布作品"}
          </Button>
        </div>
      </div>
    </div>
  );
}
