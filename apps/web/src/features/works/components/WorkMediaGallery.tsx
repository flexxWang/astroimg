"use client";

import { useState } from "react";
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

  if (videoUrl) {
    return (
      <section className="space-y-4">
        <div className="overflow-hidden rounded-3xl border bg-slate-900/95 shadow-lg">
          <video
            src={videoUrl}
            controls
            className="w-full aspect-video object-cover"
          />
        </div>
      </section>
    );
  }

  if (images.length === 0) {
    return (
      <section className="space-y-4">
        <div className="flex h-[320px] items-center justify-center rounded-3xl border bg-white/80 text-sm text-muted-foreground shadow-sm">
          暂无媒体内容
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <button
            type="button"
            className="overflow-hidden rounded-3xl border bg-white/90 shadow-sm cursor-zoom-in"
            onClick={() => openAt(0)}
          >
            {/* User-uploaded media can be served from dynamic origins at runtime. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[0]}
              alt={title}
              className="h-full w-full object-cover"
            />
          </button>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
            {images.slice(1, 5).map((url, imageIndex) => (
              <button
                key={url}
                type="button"
                className="overflow-hidden rounded-2xl border bg-white/90 cursor-zoom-in"
                onClick={() => openAt(imageIndex + 1)}
              >
                {/* User-uploaded media can be served from dynamic origins at runtime. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={title}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
            {images.length > 5 ? (
              <button
                type="button"
                className="flex items-center justify-center rounded-2xl border bg-white/80 text-sm text-muted-foreground"
                onClick={() => openAt(5)}
              >
                +{images.length - 5} 更多
              </button>
            ) : null}
          </div>
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
