# ============================================
# SEIDOR Vacaciones - Setup de Azure AD
# ============================================
# Este script registra la aplicación en Azure AD
# y configura los permisos necesarios usando Azure CLI.
#
# REQUISITOS:
# 1. Azure CLI instalado: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli
# 2. Iniciar sesión: az login
# 3. Permisos de administrador en Azure AD
#
# USO:
#    .\setup-azure-ad.ps1 -AppName "SEIDOR Vacaciones" -RedirectUri "http://localhost:3000"
# ============================================

param(
    [string]$AppName = "SEIDOR Vacaciones",
    [string]$RedirectUri = "http://localhost:3000"
)

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " SEIDOR Vacaciones - Setup Azure AD" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Crear App Registration ──
Write-Host "[1/5] Creando App Registration '$AppName'..." -ForegroundColor Yellow

$app = az ad app create `
    --display-name $AppName `
    --sign-in-audience "AzureADMyOrg" `
    --web-redirect-uris $RedirectUri `
    --enable-id-token-issuance true `
    --output json | ConvertFrom-Json

$clientId = $app.appId
$objectId = $app.id

Write-Host "  ✅ App creada" -ForegroundColor Green
Write-Host "     Client ID: $clientId" -ForegroundColor White

# ── 2. Configurar SPA redirect ──
Write-Host ""
Write-Host "[2/5] Configurando SPA redirect URI..." -ForegroundColor Yellow

# Set SPA redirect URI (the --web one doesn't set SPA type properly)
$spaPayload = @{
    spa = @{
        redirectUris = @($RedirectUri)
    }
} | ConvertTo-Json -Compress

az rest --method PATCH `
    --uri "https://graph.microsoft.com/v1.0/applications/$objectId" `
    --headers "Content-Type=application/json" `
    --body $spaPayload 2>&1 | Out-Null

Write-Host "  ✅ SPA redirect configurado: $RedirectUri" -ForegroundColor Green

# ── 3. Agregar permisos de API (Delegated) ──
Write-Host ""
Write-Host "[3/5] Configurando permisos de Microsoft Graph..." -ForegroundColor Yellow

# Microsoft Graph App ID
$graphAppId = "00000003-0000-0000-c000-000000000000"

# Delegated permission IDs
$permissions = @{
    "User.Read"            = "e1fe6dd8-ba31-4d61-89e7-88639da4683d"
    "User.ReadBasic.All"   = "b340eb25-3456-403f-be2f-af7a0d370277"
    "Mail.Send"            = "e383f46e-2787-4529-855e-0e479a3ffac0"
    "Chat.Create"          = "38826093-1258-4dea-98f0-00003be2b8d0"
    "ChatMessage.Send"     = "116b7235-7cc6-461e-b163-8e55691d839e"
    "Sites.ReadWrite.All"  = "89fe6a52-be36-487e-b7d8-d061c450a026"
}

foreach ($perm in $permissions.GetEnumerator()) {
    az ad app permission add `
        --id $clientId `
        --api $graphAppId `
        --api-permissions "$($perm.Value)=Scope" 2>&1 | Out-Null
    Write-Host "  + $($perm.Key)" -ForegroundColor Gray
}

# Application permissions (for server-side API routes)
$appPermissions = @{
    "Sites.ReadWrite.All" = "9492366f-7969-46a4-8d15-ed1a20078fff"
    "Mail.Send"           = "b633e1c5-b582-4048-a93e-9f11b44c7e96"
    "Chat.Create"         = "d9c48af6-9ad9-47ad-82c3-63757137b032"
    "ChatMessage.Send"    = "dfb0dd15-61de-45b2-be36-d6a69fba3c79"
}

foreach ($perm in $appPermissions.GetEnumerator()) {
    az ad app permission add `
        --id $clientId `
        --api $graphAppId `
        --api-permissions "$($perm.Value)=Role" 2>&1 | Out-Null
    Write-Host "  + $($perm.Key) (Application)" -ForegroundColor Gray
}

Write-Host "  ✅ Permisos configurados" -ForegroundColor Green

# ── 4. Crear Client Secret ──
Write-Host ""
Write-Host "[4/5] Creando Client Secret..." -ForegroundColor Yellow

$secret = az ad app credential reset `
    --id $clientId `
    --display-name "SEIDOR Vacaciones Secret" `
    --years 2 `
    --output json | ConvertFrom-Json

$clientSecret = $secret.password

Write-Host "  ✅ Secret creado (expira en 2 años)" -ForegroundColor Green

# ── 5. Grant Admin Consent ──
Write-Host ""
Write-Host "[5/5] Otorgando Admin Consent..." -ForegroundColor Yellow

# Create service principal first
az ad sp create --id $clientId 2>&1 | Out-Null

az ad app permission admin-consent --id $clientId 2>&1 | Out-Null

Write-Host "  ✅ Admin Consent otorgado" -ForegroundColor Green

# ── Obtener Tenant ID ──
$tenantId = (az account show --output json | ConvertFrom-Json).tenantId

# ── Resumen ──
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host " ✅ Azure AD configurado correctamente" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host " Copia estos valores al archivo .env.local:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  NEXT_PUBLIC_AZURE_CLIENT_ID=$clientId" -ForegroundColor White
Write-Host "  NEXT_PUBLIC_AZURE_TENANT_ID=$tenantId" -ForegroundColor White
Write-Host "  NEXT_PUBLIC_AZURE_REDIRECT_URI=$RedirectUri" -ForegroundColor White
Write-Host "  AZURE_CLIENT_SECRET=$clientSecret" -ForegroundColor White
Write-Host ""
Write-Host " ⚠️  IMPORTANTE: Guarda el Client Secret en un lugar seguro." -ForegroundColor Red
Write-Host "    No se podrá volver a ver después de cerrar esta ventana." -ForegroundColor Red
Write-Host ""
