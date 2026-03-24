// ============================================
// Hook de Autenticación
// ============================================

"use client";

import { useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/lib/msal-config";
import { createGraphClient } from "@/lib/graph-client";
import { useAuthStore } from "@/lib/store";

/**
 * Hook para operaciones de autenticación y acceso al cliente de Graph
 */
export function useAuth() {
  const { instance } = useMsal();
  const { user, accessToken, siteId, isLoading } = useAuthStore();

  /** Inicia sesión con popup */
  const login = useCallback(async () => {
    try {
      await instance.loginPopup(loginRequest);
    } catch (error: any) {
      // Ignorar si el usuario cerró el popup voluntariamente
      if (error?.errorCode === "user_cancelled" || error?.errorCode === "popup_window_error") {
        return;
      }
      console.error("Error en login:", error);
    }
  }, [instance]);

  /** Cierra sesión */
  const logout = useCallback(async () => {
    try {
      await instance.logoutPopup();
      useAuthStore.getState().reset();
    } catch (error) {
      console.error("Error en logout:", error);
    }
  }, [instance]);

  /** Obtiene un cliente de Graph con token vigente */
  const getGraphClient = useCallback(async () => {
    if (!accessToken) {
      throw new Error("No hay token de acceso disponible");
    }

    // Intentar renovar silenciosamente si está cerca de expirar
    try {
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        });
        useAuthStore.getState().setAccessToken(response.accessToken);
        return createGraphClient(response.accessToken);
      }
    } catch {
      // Usar el token existente
    }

    return createGraphClient(accessToken);
  }, [accessToken, instance]);

  return {
    user,
    siteId,
    isLoading,
    isAuthenticated: !!user,
    isApprover: user?.role === "approver",
    login,
    logout,
    getGraphClient,
  };
}