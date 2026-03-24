// ============================================
// Cliente de Graph Server-Side (Client Credentials)
// ============================================
// Usa flujo client_credentials para API routes
// donde no hay sesión de usuario (ej: aprobación por email)
//
// REQUISITO ADICIONAL en Azure AD:
// App Registration → Certificates & secrets → New client secret
// App Registration → API permissions → Application permissions:
//   - Sites.ReadWrite.All
//   - Mail.Send
//   - Chat.Create, ChatMessage.Send
// → Grant admin consent
// ============================================

import { Client } from "@microsoft/microsoft-graph-client";

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Simple in-memory token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Obtiene un token de acceso usando client_credentials flow
 */
async function getAppToken(): Promise<string> {
  // Check cache
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const tenantId = process.env.NEXT_PUBLIC_AZURE_TENANT_ID;
  const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Missing Azure AD credentials. Ensure AZURE_CLIENT_SECRET is set in .env.local"
    );
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get app token: ${error}`);
  }

  const data: TokenResponse = await response.json();

  // Cache with 5-minute buffer before expiry
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };

  return data.access_token;
}

/**
 * Crea un cliente de Graph autenticado con credenciales de la app
 * (no del usuario) para uso en API routes server-side
 */
export async function createServerGraphClient(): Promise<Client> {
  const token = await getAppToken();

  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => token,
    },
  });
}

/**
 * Obtiene el Site ID de SharePoint (server-side)
 */
export async function getServerSiteId(): Promise<string> {
  const siteUrl = process.env.NEXT_PUBLIC_SHAREPOINT_SITE_URL;
  if (!siteUrl) throw new Error("NEXT_PUBLIC_SHAREPOINT_SITE_URL is not set");

  const url = new URL(siteUrl);
  const client = await createServerGraphClient();

  const site = await client
    .api(`/sites/${url.hostname}:${url.pathname}`)
    .select("id")
    .get();

  return site.id;
}
