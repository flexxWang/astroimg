import { create } from "zustand";

export type ToastVariant = "default" | "destructive";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastState {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, "id">) => void;
  remove: (id: string) => void;
  has: (title: string) => boolean;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    if (get().toasts.some((t) => t.title === toast.title)) return;
    const id = crypto.randomUUID();
    set({ toasts: [...get().toasts, { id, ...toast }] });
    setTimeout(() => get().remove(id), 3000);
  },
  remove: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  has: (title) => get().toasts.some((t) => t.title === title),
}));
