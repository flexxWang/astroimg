import { useToastStore, type ToastItem } from "@/stores/toastStore";

type ToastOptions = Omit<ToastItem, "id">;

export function showToastMessage(options: ToastOptions) {
  useToastStore.getState().push(options);
}

export function showSuccessToast(
  title: string,
  description?: string,
  dedupeKey?: string,
) {
  showToastMessage({
    title,
    description,
    dedupeKey,
  });
}

export function showErrorToast(
  title: string,
  description: string,
  dedupeKey?: string,
) {
  showToastMessage({
    title,
    description,
    variant: "destructive",
    dedupeKey,
  });
}
