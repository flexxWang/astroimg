"use client";

import { useToastStore } from "@/stores/toastStore";
import { cn } from "@/lib/utils";

export default function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const remove = useToastStore((state) => state.remove);

  return (
    <div className="fixed right-6 top-20 z-50 flex w-80 flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "rounded-xl border bg-white/90 p-4 shadow-lg backdrop-blur",
            toast.variant === "destructive"
              ? "border-red-200 text-red-700"
              : "border-slate-200 text-slate-900",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">{toast.title}</div>
              {toast.description ? (
                <div className="mt-1 text-xs text-muted-foreground">
                  {toast.description}
                </div>
              ) : null}
            </div>
            <button
              className="text-xs text-muted-foreground"
              onClick={() => remove(toast.id)}
            >
              关闭
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
