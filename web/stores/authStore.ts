import { create } from "zustand";
import type { User } from "../lib/types";
import type { AuthMode } from "../components/pages/viewTypes";

type AuthState = {
  authMode: AuthMode;
  authLoading: boolean;
  user: User | null;
  authName: string;
  authEmail: string;
  authPassword: string;
  setAuthMode: (mode: AuthMode) => void;
  setAuthLoading: (value: boolean) => void;
  setUser: (user: User | null) => void;
  setAuthName: (value: string) => void;
  setAuthEmail: (value: string) => void;
  setAuthPassword: (value: string) => void;
  clearAuthPassword: () => void;
  resetAuthState: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  authMode: "login",
  authLoading: true,
  user: null,
  authName: "",
  authEmail: "",
  authPassword: "",
  setAuthMode: (mode) => set({ authMode: mode }),
  setAuthLoading: (value) => set({ authLoading: value }),
  setUser: (user) => set({ user }),
  setAuthName: (value) => set({ authName: value }),
  setAuthEmail: (value) => set({ authEmail: value }),
  setAuthPassword: (value) => set({ authPassword: value }),
  clearAuthPassword: () => set({ authPassword: "" }),
  resetAuthState: () =>
    set({
      authMode: "login",
      authLoading: false,
      user: null,
      authName: "",
      authEmail: "",
      authPassword: ""
    })
}));
