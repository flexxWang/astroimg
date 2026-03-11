import { useToastStore } from "@/stores/toastStore";

export function useToast() {
  const push = useToastStore((state) => state.push);
  const has = useToastStore((state) => state.has);
  return { toast: push, hasToast: has };
}
