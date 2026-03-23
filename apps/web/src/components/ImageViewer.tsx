"use client";

import { useEffect } from "react";

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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
      onClick={onClose}
    >
      <div className="relative max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <img
          src={images[index]}
          alt="预览"
          className="max-h-[80vh] w-auto rounded-2xl object-contain shadow-2xl"
        />
        <button
          type="button"
          className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white"
          onClick={onClose}
        >
          关闭
        </button>
        {images.length > 1 ? (
          <>
            <button
              type="button"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-white"
              onClick={() => onChange(Math.max(index - 1, 0))}
            >
              ←
            </button>
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-white"
              onClick={() => onChange(Math.min(index + 1, images.length - 1))}
            >
              →
            </button>
          </>
        ) : null}
        <div className="mt-3 text-center text-xs text-white/70">
          {index + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}
