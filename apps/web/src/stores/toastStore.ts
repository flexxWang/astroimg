import { create } from "zustand";

export type ToastVariant = "default" | "destructive";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  dedupeKey?: string;
  durationMs?: number;
}

interface ToastState {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, "id">) => void;
  remove: (id: string) => void;
  has: (
    matcher:
      | string
      | Pick<ToastItem, "title" | "description" | "variant" | "dedupeKey">,
  ) => boolean;
}

function getToastKey(toast: Pick<ToastItem, "title" | "description" | "variant" | "dedupeKey">) {
  return toast.dedupeKey ?? `${toast.variant ?? "default"}::${toast.title}::${toast.description ?? ""}`;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const nextKey = getToastKey(toast);
    if (get().toasts.some((t) => getToastKey(t) === nextKey)) return;
    const id = crypto.randomUUID();
    const durationMs = toast.durationMs ?? 3000;
    set({ toasts: [...get().toasts, { id, ...toast }] });
    setTimeout(() => get().remove(id), durationMs);
  },
  remove: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  has: (matcher) => {
    if (typeof matcher === "string") {
      return get().toasts.some((t) => t.title === matcher);
    }
    const targetKey = getToastKey(matcher);
    return get().toasts.some((t) => getToastKey(t) === targetKey);
  },
}));
