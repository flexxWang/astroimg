"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ImageViewer({
  open,
  images,
  index,
  onClose,
  onChange,
}: {
  open: boolean;
  images: string[];
  index: number;
  onClose: () => void;
  onChange: (next: number) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onChange(Math.min(index + 1, images.length - 1));
      if (event.key === "ArrowLeft") onChange(Math.max(index - 1, 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, index, onChange, onClose, open]);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
      onClick={onClose}
    >
      <div className="relative max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        {/* Viewer supports arbitrary uploaded image URLs that are not known at build time. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[index]}
          alt="预览"
          className="max-h-[80vh] w-auto rounded-2xl object-contain shadow-2xl"
        />
        {images.length > 1 ? (
          <>
            <button
              type="button"
              className="fixed left-5 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-xl text-white shadow-lg backdrop-blur transition hover:bg-white/25 sm:left-8"
              onClick={(event) => {
                event.stopPropagation();
                onChange(Math.max(index - 1, 0));
              }}
            >
              ←
            </button>
            <button
              type="button"
              className="fixed right-5 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-xl text-white shadow-lg backdrop-blur transition hover:bg-white/25 sm:right-8"
              onClick={(event) => {
                event.stopPropagation();
                onChange(Math.min(index + 1, images.length - 1));
              }}
            >
              →
            </button>
          </>
        ) : null}
        <div className="mt-3 text-center text-xs text-white/70">
          {index + 1} / {images.length}
        </div>
      </div>
      <button
        type="button"
        className="fixed right-5 top-5 inline-flex h-9 items-center justify-center rounded-full bg-white/15 px-3 text-xs font-medium text-white shadow-lg backdrop-blur transition hover:bg-white/25 sm:right-8 sm:top-8"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
      >
        关闭
      </button>
    </div>,
    document.body,
  );
}
