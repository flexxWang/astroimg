import { create } from "zustand";

interface UserState {
  token: string | null;
  hydrated: boolean;
  setToken: (token: string | null) => void;
  hydrate: () => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  token: null,
  hydrated: false,
  setToken: (token) => {
    if (typeof window !== "undefined") {
      if (token) {
        window.localStorage.setItem("astroimg_token", token);
      } else {
        window.localStorage.removeItem("astroimg_token");
      }
    }
    set({ token });
  },
  hydrate: () => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("astroimg_token");
    set({ token, hydrated: true });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("astroimg_token");
    }
    set({ token: null, hydrated: true });
  },
}));
