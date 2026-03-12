import { create } from "zustand";

interface UserState {
  user: { id: string; username: string } | null;
  hydrated: boolean;
  setUser: (user: { id: string; username: string } | null) => void;
  hydrate: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user }),
  hydrate: () => set({ hydrated: true }),
}));
