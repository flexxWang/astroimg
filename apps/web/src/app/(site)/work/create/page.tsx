"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ImagePlus,
  Images,
  Loader2,
  Trash2,
  UploadCloud,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import { useToast } from "@/hooks/useToast";
import {
  createWork,
  fetchWorkDevices,
  fetchWorkTypes,
} from "@/features/works/services/workApi";
import { signUpload, uploadFile } from "@/features/uploads/services/uploadApi";
import { showApiErrorToast } from "@/lib/showApiErrorToast";
import { queryKeys } from "@/lib/queryKeys";
import { showErrorToast, showSuccessToast } from "@/lib/showToastMessage";

const DEFAULT_UPLOAD_MAX_BYTES = 50 * 1024 * 1024;
const UPLOAD_MAX_BYTES = Number(
  process.env.NEXT_PUBLIC_UPLOAD_MAX_BYTES || DEFAULT_UPLOAD_MAX_BYTES,
);

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${Math.round(bytes / 1024 / 1024 / 1024)}GB`;
  }
  return `${Math.round(bytes / 1024 / 1024)}MB`;
}

const selectClassName =
  "h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default function CreateWorkPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
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
    queryKey: queryKeys.works.types(),
    queryFn: fetchWorkTypes,
  });
  const { data: devicesData } = useQuery({
    queryKey: queryKeys.works.devices(),
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
      const oversizedFile = validFiles.find(
        (file) => file.size > UPLOAD_MAX_BYTES,
      );
      if (oversizedFile) {
        showErrorToast(
          "图片过大",
          `单个文件不能超过 ${formatFileSize(UPLOAD_MAX_BYTES)}。`,
        );
        return;
      }
      setUploading(true);
      setMediaType("image");
      try {
        const uploaded: string[] = [];
        for (const file of validFiles) {
          const sign = await signUpload(file.name, file.type, file.size);
          await uploadFile(sign.data, file);
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
    if (file.size > UPLOAD_MAX_BYTES) {
      showErrorToast(
        "视频过大",
        `单个文件不能超过 ${formatFileSize(UPLOAD_MAX_BYTES)}。`,
      );
      return;
    }
    setUploading(true);
    setMediaType("video");
    try {
      await validateVideoDuration(file);
      const sign = await signUpload(file.name, file.type, file.size);
      await uploadFile(sign.data, file);
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
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-sm backdrop-blur">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5 border-b p-5 sm:p-6 lg:border-b-0 lg:border-r">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <Badge variant="secondary">发布作品</Badge>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    展示你的星空影像
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    上传图片组或短视频，补全类型和设备后即可发布到作品流。
                  </p>
                </div>
              </div>
              <div className="rounded-xl border bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
                {mediaType === "video"
                  ? "视频作品"
                  : mediaType === "image"
                    ? `${imageUrls.length}/9 张图片`
                    : "等待上传"}
              </div>
            </div>

            <div className="rounded-2xl border bg-slate-50/80 p-3 shadow-inner shadow-slate-200/60">
              {mediaType === "video" && videoUrl ? (
                <div className="relative overflow-hidden rounded-xl border bg-white">
                  <video
                    src={videoUrl}
                    controls
                    className="aspect-video w-full object-contain"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute right-3 top-3 bg-white/90 shadow-sm"
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
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {imageUrls.map((url, index) => (
                      <div
                        key={url}
                        className={
                          index === 0
                            ? "relative overflow-hidden rounded-xl border bg-white shadow-sm sm:col-span-2 xl:col-span-2"
                            : "relative overflow-hidden rounded-xl border bg-white shadow-sm"
                        }
                      >
                        {/* Remote user uploads can come from arbitrary object storage hosts. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt="作品预览"
                          className={
                            index === 0
                              ? "aspect-[16/10] w-full object-cover"
                              : "aspect-[4/3] w-full object-cover"
                          }
                        />
                        <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/55 to-transparent p-3">
                          <span className="rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-slate-800">
                            {index === 0 ? "封面" : `图片 ${index + 1}`}
                          </span>
                          <button
                            type="button"
                            className="inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-white"
                            aria-label="删除图片"
                            onClick={() =>
                              setImageUrls((prev) =>
                                prev.filter((item) => item !== url),
                              )
                            }
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {imageUrls.length < 9 ? (
                      <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
                        <ImagePlus className="size-4" />
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
                  <label className="group flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-muted-foreground shadow-sm transition hover:border-slate-400 hover:bg-slate-50">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={(event) =>
                        handleSelectFiles(event.target.files)
                      }
                    />
                    <span className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
                      {uploading ? (
                        <Loader2 className="size-6 animate-spin" />
                      ) : (
                        <Images className="size-6" />
                      )}
                    </span>
                    <span className="font-medium text-slate-900">
                      {uploading ? "上传中..." : "上传图片"}
                    </span>
                    <span className="mt-2 max-w-[220px] leading-6">
                      最多 9 张，支持 jpg / png / webp，第一张会作为封面展示。
                    </span>
                  </label>
                  <label className="group flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-muted-foreground shadow-sm transition hover:border-slate-400 hover:bg-slate-50">
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime"
                      className="hidden"
                      onChange={(event) =>
                        handleSelectFiles(event.target.files)
                      }
                    />
                    <span className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
                      {uploading ? (
                        <Loader2 className="size-6 animate-spin" />
                      ) : (
                        <Video className="size-6" />
                      )}
                    </span>
                    <span className="font-medium text-slate-900">上传短视频</span>
                    <span className="mt-2 max-w-[220px] leading-6">
                      支持 mp4 / mov，单个 ≤ {formatFileSize(UPLOAD_MAX_BYTES)}
                      ，时长 ≤ 30 秒。
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <aside className="flex flex-col bg-white p-5 sm:p-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">作品标题</label>
                <Input
                  placeholder="给这组影像起个名字"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="h-10 bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">作品描述</label>
                <Textarea
                  placeholder="记录目标、地点、拍摄过程或后期心得（可选）"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-[140px] bg-white leading-6"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="space-y-2">
                  <label className="text-sm font-medium">作品类型</label>
                  <select
                    value={typeId}
                    onChange={(event) => setTypeId(event.target.value)}
                    className={selectClassName}
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
                  <label className="text-sm font-medium">拍摄设备</label>
                  <select
                    value={deviceId}
                    onChange={(event) => setDeviceId(event.target.value)}
                    className={selectClassName}
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

              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="text-sm font-medium">发布检查</p>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className={
                        title.trim()
                          ? "size-4 text-emerald-600"
                          : "size-4 text-slate-300"
                      }
                    />
                    标题
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className={
                        mediaType === "image" && imageUrls.length > 0
                          ? "size-4 text-emerald-600"
                          : mediaType === "video" && videoUrl
                            ? "size-4 text-emerald-600"
                            : "size-4 text-slate-300"
                      }
                    />
                    作品媒体
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className={
                        typeId && deviceId
                          ? "size-4 text-emerald-600"
                          : "size-4 text-slate-300"
                      }
                    />
                    类型和设备
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t pt-5 lg:mt-auto">
              <Button
                onClick={handlePublish}
                disabled={publishing || uploading || !canPublish}
                className="h-10 w-full"
              >
                {publishing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    发布中...
                  </>
                ) : (
                  <>
                    <UploadCloud className="size-4" />
                    发布作品
                  </>
                )}
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                图片与视频不可混合上传，发布后会进入社区作品流。
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
