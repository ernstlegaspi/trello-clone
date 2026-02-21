"use client";

import { FormEvent, useCallback, useEffect } from "react";
import { authApi } from "../../lib/api";
import type { User } from "../../lib/types";
import { useAuthStore } from "../../stores/authStore";

type UseAuthStateParams = {
  clearFeedback: () => void;
  setError: (error: unknown) => void;
  setSuccess: (message: string) => void;
};

export default function useAuthState({
  clearFeedback,
  setError,
  setSuccess
}: UseAuthStateParams) {
  const authMode = useAuthStore((state) => state.authMode);
  const authLoading = useAuthStore((state) => state.authLoading);
  const user = useAuthStore((state) => state.user);
  const authName = useAuthStore((state) => state.authName);
  const authEmail = useAuthStore((state) => state.authEmail);
  const authPassword = useAuthStore((state) => state.authPassword);
  const setAuthMode = useAuthStore((state) => state.setAuthMode);
  const setAuthLoading = useAuthStore((state) => state.setAuthLoading);
  const setUser = useAuthStore((state) => state.setUser);
  const setAuthName = useAuthStore((state) => state.setAuthName);
  const setAuthEmail = useAuthStore((state) => state.setAuthEmail);
  const setAuthPassword = useAuthStore((state) => state.setAuthPassword);
  const clearAuthPassword = useAuthStore((state) => state.clearAuthPassword);

  useEffect(() => {
    let alive = true;

    const bootstrap = async () => {
      setAuthLoading(true);
      try {
        const token = authApi.getAccessToken();
        if (!token) {
          return;
        }
        const me = await authApi.me();
        if (!alive) {
          return;
        }
        setUser(me);
      } catch {
        authApi.clearAccessToken();
      } finally {
        if (alive) {
          setAuthLoading(false);
        }
      }
    };

    bootstrap();
    return () => {
      alive = false;
    };
  }, []);

  const handleAuthSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      clearFeedback();
      try {
        let me: User;
        if (authMode === "register") {
          me = await authApi.register({
            name: authName,
            email: authEmail,
            password: authPassword
          });
        } else {
          me = await authApi.login({
            email: authEmail,
            password: authPassword
          });
        }
        setUser(me);
        clearAuthPassword();
        setSuccess(authMode === "register" ? "Welcome, account created." : "Logged in.");
      } catch (error) {
        setError(error);
      }
    },
    [
      authEmail,
      authMode,
      authName,
      authPassword,
      clearAuthPassword,
      clearFeedback,
      setError,
      setSuccess
    ]
  );

  const handleLogout = useCallback(async () => {
    clearFeedback();
    try {
      await authApi.logout();
    } catch {
      authApi.clearAccessToken();
    }
    setUser(null);
  }, [clearFeedback]);

  return {
    authMode,
    authLoading,
    user,
    authName,
    authEmail,
    authPassword,
    setAuthMode,
    setAuthName,
    setAuthEmail,
    setAuthPassword,
    handleAuthSubmit,
    handleLogout
  };
}
