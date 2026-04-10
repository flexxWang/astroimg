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
import {
  createWork,
  fetchWorkDevices,
  fetchWorkTypes,
} from "@/services/workApi";
import { signUpload, uploadFile } from "@/services/uploadApi";
import { showApiErrorToast } from "@/lib/showApiErrorToast";
import { showErrorToast, showSuccessToast } from "@/lib/showToastMessage";

export default function CreateWorkPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { hasToast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [typeId, setTypeId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
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

  const canPublish = useMemo(() => {
    if (!title.trim() || !typeId || !deviceId) return false;
    if (mediaType === "image") return imageUrls.length > 0;
    if (mediaType === "video") return Boolean(videoUrl);
    return false;
  }, [deviceId, imageUrls.length, mediaType, title, typeId, videoUrl]);

  const validateVideoDuration = async (file: File) => {
    const url = URL.createObjectURL(file);
    try {
      const duration = await new Promise<number>((resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => resolve(video.duration);
        video.onerror = () => reject(new Error("无法读取视频时长"));
        video.src = url;
      });
      if (duration > 30) {
        throw new Error("视频时长不能超过 30 秒");
      }
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const handleSelectFiles = async (files?: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!user) {
      router.push("/login");
      return;
    }
    const list = Array.from(files);
    const first = list[0];
    const isVideo = first.type.startsWith("video/");
    const nextType: "image" | "video" = isVideo ? "video" : "image";

    if (mediaType && mediaType !== nextType) {
      showErrorToast(
        "不能混合上传",
        "图片与视频不能混合上传，请先清空再选择。",
      );
      return;
    }

    if (nextType === "image") {
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      const validFiles = list.filter((file) => allowed.includes(file.type));
      if (validFiles.length === 0) {
        showErrorToast("格式不支持", "仅支持 jpg / jpeg / png / webp。");
        return;
      }
      if (imageUrls.length + validFiles.length > 9) {
        showErrorToast("图片数量过多", "最多上传 9 张图片。");
        return;
      }
      setUploading(true);
      setMediaType("image");
      try {
        const uploaded: string[] = [];
        for (const file of validFiles) {
          const sign = await signUpload(file.name, file.type);
          await uploadFile(sign.data.uploadUrl, file);
          uploaded.push(sign.data.fileUrl);
        }
        setImageUrls((prev) => [...prev, ...uploaded]);
        showSuccessToast("图片已上传");
      } catch (err) {
        showApiErrorToast(err, {
          title: "上传失败",
          fallback: "上传失败，请稍后再试。",
        });
      } finally {
        setUploading(false);
      }
      return;
    }

    // video
    if (list.length > 1) {
      showErrorToast("只能上传一个视频", "视频作品仅支持 1 个文件。");
      return;
    }
    const file = list[0];
    const allowedVideo = ["video/mp4", "video/quicktime"];
    if (!allowedVideo.includes(file.type)) {
      showErrorToast("格式不支持", "仅支持 mp4 / mov。");
      return;
    }
    if (file.size > 1024 * 1024 * 1024) {
      showErrorToast("视频过大", "视频大小不能超过 1GB。");
      return;
    }
    setUploading(true);
    setMediaType("video");
    try {
      await validateVideoDuration(file);
      const sign = await signUpload(file.name, file.type);
      await uploadFile(sign.data.uploadUrl, file);
      setVideoUrl(sign.data.fileUrl);
      showSuccessToast("视频已上传");
    } catch (err) {
      showApiErrorToast(err, {
        title: "上传失败",
        fallback: "上传失败，请稍后再试。",
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
        showErrorToast("请补全作品信息", "标题、作品图、类型、设备为必填项。");
      }
      return;
    }
    setPublishing(true);
    try {
      await createWork({
        title: title.trim(),
        description: description.trim() || undefined,
        mediaType: mediaType ?? "image",
        imageUrls: mediaType === "image" ? imageUrls : undefined,
        videoUrl: mediaType === "video" ? videoUrl : undefined,
        typeId,
        deviceId,
      });
      router.push("/");
    } catch {
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
          支持图片（最多 9 张）或视频（单个 ≤1GB，≤30 秒），不可混合上传。
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
          <label className="text-sm text-muted-foreground">作品媒体</label>
          {mediaType === "video" && videoUrl ? (
            <div className="relative overflow-hidden rounded-2xl border">
              <video
                src={videoUrl}
                controls
                className="h-[360px] w-full object-cover"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute right-3 top-3"
                onClick={() => {
                  setVideoUrl("");
                  setMediaType(null);
                }}
              >
                重新上传
              </Button>
            </div>
          ) : mediaType === "image" && imageUrls.length > 0 ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {imageUrls.map((url) => (
                  <div
                    key={url}
                    className="relative overflow-hidden rounded-2xl border"
                  >
                    <img
                      src={url}
                      alt="作品预览"
                      className="h-[180px] w-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs"
                      onClick={() =>
                        setImageUrls((prev) =>
                          prev.filter((item) => item !== url),
                        )
                      }
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                {imageUrls.length < 9 ? (
                  <label className="flex h-12 cursor-pointer items-center justify-center rounded-xl border border-dashed px-4 text-sm text-muted-foreground hover:bg-slate-50">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={(event) =>
                        handleSelectFiles(event.target.files)
                      }
                    />
                    继续上传图片
                  </label>
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setImageUrls([]);
                    setMediaType(null);
                  }}
                >
                  清空图片
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground hover:bg-slate-50">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(event) => handleSelectFiles(event.target.files)}
                />
                {uploading ? "上传中..." : "上传图片（最多9张）"}
              </label>
              <label className="flex h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground hover:bg-slate-50">
                <input
                  type="file"
                  accept="video/mp4,video/quicktime"
                  className="hidden"
                  onChange={(event) => handleSelectFiles(event.target.files)}
                />
                {uploading ? "上传中..." : "上传视频（单个，≤1GB）"}
              </label>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            onClick={handlePublish}
            disabled={publishing || uploading || !canPublish}
          >
            {publishing ? "发布中..." : "发布作品"}
          </Button>
        </div>
      </div>
    </div>
  );
}
