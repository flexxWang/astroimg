"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import ImageViewer from "@/shared/components/ImageViewer";

export default function WorkMediaGallery({
  images,
  title,
  videoUrl,
}: {
  images: string[];
  title: string;
  videoUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const openAt = (nextIndex: number) => {
    setIndex(nextIndex);
    setOpen(true);
  };
  const goToPrev = () => {
    setIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  };
  const goToNext = () => {
    setIndex((current) => (current + 1) % images.length);
  };

  if (videoUrl) {
    return (
      <section>
        <div className="overflow-hidden rounded-2xl border bg-slate-50 shadow-inner shadow-slate-200/70">
          <video
            src={videoUrl}
            controls
            className="aspect-video w-full bg-black object-contain"
          />
        </div>
      </section>
    );
  }

  if (images.length === 0) {
    return (
      <section>
        <div className="flex min-h-[420px] items-center justify-center rounded-2xl border bg-slate-50 text-sm text-muted-foreground">
          暂无媒体内容
        </div>
      </section>
    );
  }

  return (
    <>
      <section>
        <div className="overflow-hidden rounded-2xl border bg-slate-50 shadow-inner shadow-slate-200/70">
          <div className="relative bg-white p-2">
            <button
              type="button"
              className="group relative block w-full overflow-hidden rounded-xl bg-slate-100 cursor-zoom-in"
              onClick={() => openAt(index)}
            >
              {/* User-uploaded media can be served from dynamic origins at runtime. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[index]}
                alt={title}
                className="aspect-[16/10] w-full object-cover transition duration-300 group-hover:scale-[1.015]"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/45 to-transparent p-4 text-left">
                <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-800">
                  查看大图
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                  <Images className="size-3.5" />
                  {index + 1}/{images.length}
                </span>
              </div>
            </button>

            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  className="absolute left-5 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-white"
                  aria-label="上一张"
                  onClick={goToPrev}
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  className="absolute right-5 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-white"
                  aria-label="下一张"
                  onClick={goToNext}
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto border-t bg-slate-50/80 p-3">
              {images.map((url, imageIndex) => (
                <button
                  key={url}
                  type="button"
                  className={
                    imageIndex === index
                      ? "shrink-0 overflow-hidden rounded-lg border-2 border-slate-900 bg-white shadow-sm"
                      : "shrink-0 overflow-hidden rounded-lg border-2 border-transparent bg-white opacity-70 shadow-sm transition hover:opacity-100"
                  }
                  aria-label={`切换到第 ${imageIndex + 1} 张`}
                  onClick={() => setIndex(imageIndex)}
                >
                  {/* User-uploaded media can be served from dynamic origins at runtime. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={title}
                    className="h-16 w-24 object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <ImageViewer
        open={open}
        images={images}
        index={index}
        onClose={() => setOpen(false)}
        onChange={setIndex}
      />
    </>
  );
}
