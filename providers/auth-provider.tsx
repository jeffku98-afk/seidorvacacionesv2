// ============================================
// Proveedor de Autenticación MSAL
// ============================================

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PublicClientApplication,
  EventType,
  type AuthenticationResult,
} from "@azure/msal-browser";
import { MsalProvider, useMsal, useIsAuthenticated } from "@azure/msal-react";
import { msalConfig, loginRequest } from "@/lib/msal-config";
import {
  createGraphClient,
  getMyProfile,
  getSharePointSiteId,
} from "@/lib/graph-client";
import { isUserApprover } from "@/lib/sharepoint";
import { useAuthStore } from "@/lib/store";
import type { AppUser } from "@/types";

// Singleton de MSAL
const msalInstance = new PublicClientApplication(msalConfig);

// Promise que se resuelve cuando MSAL está listo
const msalReady = msalInstance.initialize().then(() => {
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }

  msalInstance.addEventCallback((event) => {
    if (
      event.eventType === EventType.LOGIN_SUCCESS &&
      (event.payload as AuthenticationResult)?.account
    ) {
      const account = (event.payload as AuthenticationResult).account;
      msalInstance.setActiveAccount(account);
    }
  });
});

/**
 * Componente interno que maneja la lógica de auth
 */
function AuthHandler({ children }: { children: React.ReactNode }) {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const { setUser, setAccessToken, setSiteId, setLoading } = useAuthStore();

  const initializeUser = useCallback(async () => {
    if (!isAuthenticated || accounts.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });
      const token = response.accessToken;
      setAccessToken(token);

      const client = createGraphClient(token);
      const profile = await getMyProfile(client);

      let userRole: "user" | "approver" = "user";

      try {
        const siteUrl = process.env.NEXT_PUBLIC_SHAREPOINT_SITE_URL;
        if (siteUrl) {
          const siteId = await getSharePointSiteId(client, siteUrl);
          setSiteId(siteId);
          const approver = await isUserApprover(client, siteId, profile.mail);
          if (approver) userRole = "approver";
        }
      } catch (spError) {
        console.warn("SharePoint no disponible, continuando sin él:", spError);
      }

      const appUser: AppUser = {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.mail,
        department: profile.department,
        jobTitle: profile.jobTitle,
        role: userRole,
      };
      setUser(appUser);
    } catch (error) {
      console.error("Error inicializando usuario:", error);
      if ((error as any)?.name === "InteractionRequiredAuthError") {
        await instance.acquireTokenRedirect(loginRequest);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, accounts, instance, setUser, setAccessToken, setSiteId, setLoading]);

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  return <>{children}</>;
}

/**
 * Provider principal de autenticación
 * Espera a que MSAL esté inicializado antes de renderizar
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    msalReady.then(() => setIsReady(true));
  }, []);

  if (!isReady) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F4F7FB",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, margin: "0 auto 12px",
            background: "linear-gradient(135deg, #3447B0, #4464E2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24,
          }}>🌴</div>
          <p style={{ color: "#8490B4", fontSize: 14 }}>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      <AuthHandler>{children}</AuthHandler>
    </MsalProvider>
  );
}