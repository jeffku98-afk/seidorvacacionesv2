import { Configuration, LogLevel, PopupRequest } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID}`,
    redirectUri: process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI || "http://localhost:3000",
    postLogoutRedirectUri: "/",
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        // Ignorar errores de popup cerrado por el usuario
        if (message.includes("window closed") || message.includes("user_cancelled")) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            break;
          case LogLevel.Warning:
            console.warn(message);
            break;
          case LogLevel.Info:
            if (process.env.NODE_ENV === "development") console.info(message);
            break;
        }
      },
      logLevel: LogLevel.Warning,
    },
  },
};

/** Scopes necesarios para la app */
export const loginRequest: PopupRequest = {
  scopes: [
    "User.Read",
    "User.ReadBasic.All",
    "Mail.Send",
    "Chat.Create",
    "ChatMessage.Send",
    "Sites.ReadWrite.All",
  ],
};

/** Scopes para Microsoft Graph API */
export const graphScopes = {
  user: ["User.Read", "User.ReadBasic.All"],
  mail: ["Mail.Send"],
  teams: ["Chat.Create", "ChatMessage.Send"],
  sharepoint: ["Sites.ReadWrite.All"],
};