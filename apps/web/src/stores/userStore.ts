import { create } from "zustand";

interface UserState {
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  hydrated: false,
  setHydrated: (hydrated) => set({ hydrated }),
}));
