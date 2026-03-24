// ============================================
// Cliente de Microsoft Graph API
// ============================================
// Centraliza todas las llamadas a Graph: usuarios, correos, Teams
// Docs: https://learn.microsoft.com/en-us/graph/api/overview
// ============================================

import {
  Client,
  AuthenticationProvider,
} from "@microsoft/microsoft-graph-client";
import type { GraphUser, NotificationPayload } from "@/types";

/**
 * Crea una instancia del cliente de Graph con el token de acceso actual
 */
export function createGraphClient(accessToken: string): Client {
  const authProvider: AuthenticationProvider = {
    getAccessToken: async () => accessToken,
  };

  return Client.initWithMiddleware({ authProvider });
}

// ─── USUARIOS ────────────────────────────────────

/**
 * Obtiene el perfil del usuario autenticado
 */
export async function getMyProfile(client: Client): Promise<GraphUser> {
  const user = await client
    .api("/me")
    .select("id,displayName,mail,department,jobTitle")
    .get();
  return user;
}

/**
 * Obtiene la foto del usuario autenticado (base64)
 */
export async function getMyPhoto(client: Client): Promise<string | null> {
  try {
    const photoBlob = await client.api("/me/photo/$value").get();
    const buffer = await photoBlob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:image/jpeg;base64,${base64}`;
  } catch {
    return null;
  }
}

/**
 * Busca usuarios en el directorio de la organización
 */
export async function searchUsers(
  client: Client,
  query: string
): Promise<GraphUser[]> {
  const result = await client
    .api("/users")
    .filter(`startsWith(displayName,'${query}') or startsWith(mail,'${query}')`)
    .select("id,displayName,mail,department,jobTitle")
    .top(10)
    .get();
  return result.value;
}

/**
 * Obtiene un usuario por su ID de Azure AD
 */
export async function getUserById(
  client: Client,
  userId: string
): Promise<GraphUser> {
  return client
    .api(`/users/${userId}`)
    .select("id,displayName,mail,department,jobTitle")
    .get();
}

// ─── CORREO (Exchange) ──────────────────────────

/**
 * Envía un correo electrónico vía Microsoft Graph
 * Usa la cuenta del usuario autenticado como remitente
 */
export async function sendEmail(
  client: Client,
  payload: NotificationPayload
): Promise<void> {
  const message = {
    subject: payload.subject,
    body: {
      contentType: "HTML",
      content: payload.bodyHtml,
    },
    toRecipients: payload.to.map((email) => ({
      emailAddress: { address: email },
    })),
    ccRecipients: (payload.cc || []).map((email) => ({
      emailAddress: { address: email },
    })),
  };

  await client.api("/me/sendMail").post({ message, saveToSentItems: true });
}

// ─── TEAMS ──────────────────────────────────────

/**
 * Envía un mensaje directo vía Microsoft Teams
 * Crea un chat 1:1 y envía el mensaje
 */
export async function sendTeamsNotification(
  client: Client,
  recipientUserId: string,
  message: string
): Promise<void> {
  // 1. Obtener mi ID
  const me = await client.api("/me").select("id").get();

  // 2. Crear (o reutilizar) chat 1:1
  const chat = await client.api("/chats").post({
    chatType: "oneOnOne",
    members: [
      {
        "@odata.type": "#microsoft.graph.aadUserConversationMember",
        roles: ["owner"],
        "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${me.id}')`,
      },
      {
        "@odata.type": "#microsoft.graph.aadUserConversationMember",
        roles: ["owner"],
        "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${recipientUserId}')`,
      },
    ],
  });

  // 3. Enviar mensaje al chat
  await client.api(`/chats/${chat.id}/messages`).post({
    body: {
      contentType: "html",
      content: message,
    },
  });
}

// ─── SHAREPOINT ─────────────────────────────────

/**
 * Obtiene el ID del sitio de SharePoint
 */
export async function getSharePointSiteId(
  client: Client,
  siteUrl: string
): Promise<string> {
  // Parsear la URL: https://tenant.sharepoint.com/sites/SiteName
  const url = new URL(siteUrl);
  const hostname = url.hostname;
  const sitePath = url.pathname;

  const site = await client
    .api(`/sites/${hostname}:${sitePath}`)
    .select("id")
    .get();
  return site.id;
}

/**
 * Obtiene items de una lista de SharePoint
 */
export async function getListItems<T>(
  client: Client,
  siteId: string,
  listName: string,
  filter?: string,
  orderBy?: string
): Promise<T[]> {
  let request = client
    .api(`/sites/${siteId}/lists/${listName}/items`)
    .expand("fields");

  if (filter) request = request.filter(filter);
  if (orderBy) request = request.orderby(orderBy);

  const result = await request.top(500).get();
  return result.value.map((item: any) => ({
    id: item.id,
    ...item.fields,
  }));
}

/**
 * Crea un item en una lista de SharePoint
 */
export async function createListItem<T extends Record<string, any>>(
  client: Client,
  siteId: string,
  listName: string,
  fields: T
): Promise<any> {
  const result = await client
    .api(`/sites/${siteId}/lists/${listName}/items`)
    .post({ fields });
  return { id: result.id, ...result.fields };
}

/**
 * Actualiza un item de una lista de SharePoint
 */
export async function updateListItem(
  client: Client,
  siteId: string,
  listName: string,
  itemId: string,
  fields: Record<string, any>
): Promise<void> {
  await client
    .api(`/sites/${siteId}/lists/${listName}/items/${itemId}/fields`)
    .patch(fields);
}
