# 🌴 SEIDOR Vacaciones

Sistema de solicitud, aprobación y seguimiento de vacaciones para la organización SEIDOR. Construido con **Next.js 15**, **HeroUI**, **TanStack Query** e integrado con **Microsoft 365** (SharePoint, Exchange, Teams).

---

## 📋 Tabla de Contenidos

1. [Arquitectura](#-arquitectura)
2. [Requisitos Previos](#-requisitos-previos)
3. [Configuración de Azure AD](#-configuración-de-azure-ad)
4. [Configuración de SharePoint](#-configuración-de-sharepoint)
5. [Instalación Local](#-instalación-local)
6. [Estructura del Proyecto](#-estructura-del-proyecto)
7. [Flujos de la Aplicación](#-flujos-de-la-aplicación)
8. [Despliegue](#-despliegue)

---

## 🏗 Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  Next.js 15 + HeroUI + TanStack Query + Zustand     │
│  Autenticación: MSAL.js (Azure AD / Entra ID)       │
└──────────────────────┬──────────────────────────────┘
                       │ Microsoft Graph API
                       ▼
┌─────────────────────────────────────────────────────┐
│                 MICROSOFT 365                        │
│                                                      │
│  ┌──────────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  SharePoint   │ │ Exchange │ │  Microsoft Teams  │ │
│  │  (Listas SP)  │ │ (Correo) │ │  (Notificaciones)│ │
│  └──────────────┘ └──────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Stack tecnológico:**

| Componente | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | HeroUI v2 + Tailwind CSS |
| Estado servidor | TanStack React Query v5 |
| Estado global | Zustand |
| Autenticación | MSAL.js v4 (Azure AD / Entra ID) |
| API | Microsoft Graph API |
| Base de datos | Listas de SharePoint |
| Correo | Exchange Online (Graph API) |
| Notificaciones | Microsoft Teams (Graph API) |
| Fechas | date-fns |
| Toasts | Sonner |

---

## 📦 Requisitos Previos

- **Node.js** v18.17 o superior
- **npm** v9 o superior (o pnpm/yarn)
- **Tenant de Microsoft 365** con acceso de administrador
- **SharePoint Online** con un sitio para RRHH
- **Licencias de Microsoft 365** con Exchange Online y Teams

---

## 🔐 Configuración de Azure AD

### 1. Registrar la Aplicación

1. Ir a [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations**
2. Hacer clic en **New registration**
3. Configurar:
   - **Name:** `SEIDOR Vacaciones`
   - **Supported account types:** "Accounts in this organizational directory only"
   - **Redirect URI:** Tipo `Single-page application (SPA)` → `http://localhost:3000`
4. Copiar el **Application (client) ID** y **Directory (tenant) ID**

### 2. Configurar Permisos de API

En la app registrada → **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions:**

| Permiso | Descripción |
|---|---|
| `User.Read` | Leer perfil del usuario autenticado |
| `User.ReadBasic.All` | Buscar usuarios en el directorio |
| `Mail.Send` | Enviar correos como el usuario |
| `Chat.Create` | Crear chats 1:1 en Teams |
| `ChatMessage.Send` | Enviar mensajes en chats de Teams |
| `Sites.ReadWrite.All` | Leer/escribir en listas de SharePoint |

Luego agregar **Application permissions** (necesarias para las API routes server-side de aprobación por correo):

| Permiso | Descripción |
|---|---|
| `Sites.ReadWrite.All` | Acceder a SharePoint sin sesión de usuario |
| `Mail.Send` | Enviar correos desde API route |
| `Chat.Create` | Crear chats desde API route |
| `ChatMessage.Send` | Enviar mensajes desde API route |

Después hacer clic en **Grant admin consent for [Organización]**.

### 3. Crear Client Secret

App Registration → **Certificates & secrets** → **New client secret** → copiar el valor al `.env.local` como `AZURE_CLIENT_SECRET`.

### 4. Redirect URIs adicionales (Producción)

Agregar la URL de producción como Redirect URI adicional: `https://tu-dominio.com`

> **💡 Automatizado:** Puedes ejecutar `.\scripts\setup-azure-ad.ps1` para hacer todo esto automáticamente con Azure CLI.

---

## 📊 Configuración de SharePoint

### 1. Crear Sitio (si no existe)

Ir a SharePoint Admin Center → crear un sitio de equipo llamado **"RRHH"** (o el que prefieras).

### 2. Crear Lista: `Aprobadores`

En el sitio de SharePoint, crear una lista personalizada con estas columnas:

| Columna | Tipo | Requerido |
|---|---|---|
| Title | Single line of text | Sí (Nombre del aprobador) |
| AzureUserId | Single line of text | Sí (Object ID de Azure AD) |
| Email | Single line of text | Sí |
| Department | Single line of text | Sí |

**Poblar la lista** con los usuarios que tendrán rol de aprobador. El `AzureUserId` se puede obtener desde Azure Portal → Users → seleccionar usuario → Object ID.

### 3. Crear Lista: `SolicitudesVacaciones`

Crear otra lista personalizada con estas columnas:

| Columna | Tipo | Requerido |
|---|---|---|
| Title | Single line of text | Sí (ID de solicitud: REQ-XXXXXXXX-XXXX) |
| UserId | Single line of text | Sí |
| UserName | Single line of text | Sí |
| UserEmail | Single line of text | Sí |
| ApproverId | Single line of text | Sí |
| ApproverName | Single line of text | Sí |
| ApproverEmail | Single line of text | Sí |
| StartDate | Date only | Sí |
| EndDate | Date only | Sí |
| TotalDays | Number (0 decimals) | Sí |
| Reason | Multiple lines of text | Sí |
| BackupUserId | Single line of text | Sí |
| BackupUserName | Single line of text | Sí |
| BackupUserEmail | Single line of text | Sí |
| PendingTasks | Multiple lines of text | No |
| Status | Choice (Pending, Approved, Rejected) | Sí (Default: Pending) |
| ApproverComments | Multiple lines of text | No |
| CreatedAt | Date and time | Sí |
| UpdatedAt | Date and time | Sí |

> **💡 Automatizado:** Puedes ejecutar `.\scripts\setup-sharepoint.ps1 -SiteUrl "https://tuorg.sharepoint.com/sites/RRHH"` para crear ambas listas automáticamente con PnP PowerShell.

---

## 🚀 Instalación Local

### 1. Clonar e instalar dependencias

```bash
cd seidor-vacaciones
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Editar `.env.local` con los valores reales:

```env
NEXT_PUBLIC_AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_AZURE_REDIRECT_URI=http://localhost:3000
NEXT_PUBLIC_SHAREPOINT_SITE_URL=https://tuorg.sharepoint.com/sites/RRHH
NEXT_PUBLIC_SP_LIST_SOLICITUDES=SolicitudesVacaciones
NEXT_PUBLIC_SP_LIST_APROBADORES=Aprobadores
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## 📁 Estructura del Proyecto

```
seidor-vacaciones/
├── app/
│   ├── globals.css              # Estilos globales + Tailwind
│   ├── layout.tsx               # Layout raíz con providers
│   ├── page.tsx                 # Redirección según auth
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx         # Página de login con Microsoft
│   ├── (dashboard)/
│   │   ├── layout.tsx           # Layout con sidebar
│   │   ├── solicitudes/
│   │   │   └── page.tsx         # Dashboard + Mis solicitudes
│   │   ├── solicitar/
│   │   │   └── page.tsx         # Formulario nueva solicitud
│   │   ├── aprobaciones/
│   │   │   └── page.tsx         # Gestión de aprobaciones
│   │   └── calendario/
│   │       └── page.tsx         # Calendario del equipo
│   ├── action-result/
│   │   └── page.tsx             # Resultado de acción desde correo
│   └── api/
│       └── requests/
│           └── [id]/
│               ├── approve/
│               │   └── route.ts # API: aprobar desde correo
│               └── reject/
│                   └── route.ts # API: rechazar desde correo
├── components/
│   ├── layout/
│   │   └── sidebar.tsx          # Sidebar de navegación
│   ├── forms/
│   │   └── date-picker.tsx      # DatePicker personalizado
│   └── ui/
│       ├── page-header.tsx      # Encabezado de página
│       └── status-badge.tsx     # Badge de estado
├── hooks/
│   ├── index.ts                 # Barrel exports
│   ├── use-auth.ts              # Hook de autenticación
│   └── use-requests.ts          # Hooks TanStack Query
├── lib/
│   ├── action-tokens.ts         # Tokens firmados para acciones email
│   ├── dates.ts                 # Utilidades de fecha
│   ├── graph-client.ts          # Cliente Microsoft Graph (client-side)
│   ├── graph-server.ts          # Cliente Microsoft Graph (server-side)
│   ├── msal-config.ts           # Configuración MSAL
│   ├── notifications.ts         # Servicio de notificaciones
│   ├── sharepoint.ts            # Operaciones SharePoint
│   └── store.ts                 # Store global (Zustand)
├── providers/
│   ├── auth-provider.tsx        # Provider MSAL
│   └── query-provider.tsx       # Provider React Query
├── scripts/
│   ├── setup-azure-ad.ps1       # Script: registrar app en Azure AD
│   └── setup-sharepoint.ps1     # Script: crear listas en SharePoint
├── types/
│   └── index.ts                 # Definiciones TypeScript
├── public/
│   └── logo.png                 # Logo SEIDOR
├── middleware.ts                 # Protección de rutas
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── package.json
└── .env.local.example
```

---

## 🔄 Flujos de la Aplicación

### Flujo 1: Solicitar Vacaciones

```
Usuario abre "Solicitar"
    │
    ├─▶ Selecciona Aprobador (de lista SharePoint)
    ├─▶ Selecciona Fecha Inicio y Fin (DatePicker custom)
    ├─▶ Escribe Motivo
    ├─▶ Selecciona Encargado de Pendientes (búsqueda Graph API)
    ├─▶ Escribe Tareas Pendientes
    │
    └─▶ Enviar Solicitud
         │
         ├─▶ 1. Se crea item en lista SharePoint "SolicitudesVacaciones"
         ├─▶ 2. Se envía correo al Aprobador (CC: Encargado de pendientes)
         └─▶ 3. Se envía notificación por Teams al Aprobador
```

### Flujo 2: Aprobar/Rechazar Solicitud (desde la App)

```
Aprobador abre "Aprobaciones"
    │
    ├─▶ Ve lista de solicitudes pendientes
    ├─▶ Expande detalle de una solicitud
    ├─▶ Hace clic en "Aprobar" o "Rechazar"
    │
    └─▶ Confirma acción (con comentarios opcionales)
         │
         ├─▶ 1. Se actualiza Status en lista SharePoint
         ├─▶ 2. Se envía correo al Solicitante
         └─▶ 3. Se envía notificación por Teams al Solicitante
```

### Flujo 2b: Aprobar/Rechazar Solicitud (desde el Correo)

```
Aprobador recibe correo de nueva solicitud
    │
    ├─▶ Correo incluye botones "✅ Aprobar" y "❌ Rechazar"
    ├─▶ Cada botón contiene un token firmado (HMAC-SHA256, 7 días)
    │
    └─▶ Hace clic en el botón
         │
         ├─▶ GET /api/requests/[id]/approve?token=xxx
         ├─▶ Se valida el token (firma + expiración + acción)
         ├─▶ Se actualiza SharePoint (server-side, client_credentials)
         ├─▶ Se notifica al solicitante (correo + Teams)
         └─▶ Se muestra página de confirmación /action-result
```

### Flujo 3: Consultar Calendario

```
Cualquier usuario abre "Calendario"
    │
    └─▶ Ve calendario mensual con vacaciones aprobadas
         (nombres completos, colores por usuario, tooltip con fechas)
```

---

## 🛠 Scripts de Configuración

Se incluyen scripts de PowerShell para automatizar el setup.

### Setup Azure AD

Registra la app en Azure AD, configura permisos y crea el Client Secret:

```powershell
# Requisito: Azure CLI (az login)
.\scripts\setup-azure-ad.ps1 -AppName "SEIDOR Vacaciones" -RedirectUri "http://localhost:3000"
```

El script genera los valores para `.env.local` automáticamente.

### Setup SharePoint

Crea las listas `Aprobadores` y `SolicitudesVacaciones` con todas sus columnas:

```powershell
# Requisito: PnP PowerShell (Install-Module PnP.PowerShell)
.\scripts\setup-sharepoint.ps1 -SiteUrl "https://tuorg.sharepoint.com/sites/RRHH"
```

Después de ejecutar el script, agrega manualmente los aprobadores a la lista.

---

## 🌐 Despliegue

### Vercel (Recomendado)

1. Conectar repositorio a [Vercel](https://vercel.com)
2. Configurar las variables de entorno en Vercel Dashboard
3. Actualizar `NEXT_PUBLIC_AZURE_REDIRECT_URI` y `NEXT_PUBLIC_APP_URL` con el dominio de producción
4. Agregar el dominio de producción como Redirect URI en Azure AD

### Azure Static Web Apps

1. Crear recurso Static Web App en Azure Portal
2. Conectar con el repositorio
3. Configurar build: `npm run build` / Output: `.next`
4. Configurar variables de entorno

---

## 🔒 Seguridad

- **Middleware:** Las rutas protegidas (`/solicitudes`, `/solicitar`, `/aprobaciones`, `/calendario`) verifican sesión MSAL activa.
- **Tokens de acción:** Los enlaces de "Aprobar/Rechazar" en correos usan tokens HMAC-SHA256 firmados con el Client Secret. Expiran en 7 días y son de un solo uso (la solicitud cambia de estado).
- **Client Credentials:** Las API routes server-side usan flujo `client_credentials` para operar sin sesión de usuario (aprobación desde correo).
- **Scopes mínimos:** Solo se solicitan los permisos estrictamente necesarios en Microsoft Graph.

---

## 🔧 Consideraciones Técnicas

- **Días calendario:** La app cuenta sábados y domingos dentro del total de días, según el requerimiento.
- **Tokens MSAL:** Se renuevan silenciosamente. Si expiran, se redirige al login.
- **Cache:** TanStack Query cachea las consultas por 2 minutos y revalida al volver a la pestaña (`refetchOnWindowFocus`).
- **Rol de Aprobador:** Se determina al login comparando el email del usuario con la lista "Aprobadores" de SharePoint.
- **Notificaciones resilientes:** Si fallan las notificaciones (correo/Teams), la solicitud se crea igual en SharePoint. Los errores se loguean sin bloquear el flujo.
- **Doble vía de aprobación:** El aprobador puede actuar desde la app O desde el correo. Ambas vías actualizan SharePoint y notifican al solicitante.
- **Protección contra doble acción:** Si una solicitud ya fue procesada, los enlaces del correo muestran "Esta solicitud ya fue procesada anteriormente".
