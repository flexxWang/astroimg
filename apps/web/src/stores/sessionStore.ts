import { create } from "zustand";

interface SessionState {
  authBootstrapComplete: boolean;
  setAuthBootstrapComplete: (complete: boolean) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  authBootstrapComplete: false,
  setAuthBootstrapComplete: (complete) =>
    set({ authBootstrapComplete: complete }),
}));
