// ============================================
// Store Global de Autenticación (Zustand)
// ============================================

import { create } from "zustand";
import type { AppUser } from "@/types";

interface AuthState {
  user: AppUser | null;
  accessToken: string | null;
  siteId: string | null;
  isLoading: boolean;
  setUser: (user: AppUser | null) => void;
  setAccessToken: (token: string | null) => void;
  setSiteId: (siteId: string | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  siteId: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setSiteId: (siteId) => set({ siteId }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () =>
    set({
      user: null,
      accessToken: null,
      siteId: null,
      isLoading: false,
    }),
}));
