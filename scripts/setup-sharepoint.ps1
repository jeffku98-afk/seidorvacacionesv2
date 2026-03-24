# ============================================
# SEIDOR Vacaciones - Setup de SharePoint
# ============================================
# Este script crea las listas necesarias en SharePoint
# usando PnP PowerShell.
#
# REQUISITOS:
# 1. Instalar PnP PowerShell:
#    Install-Module -Name PnP.PowerShell -Scope CurrentUser
#
# 2. Tener permisos de Site Owner en el sitio de SharePoint
#
# USO:
#    .\setup-sharepoint.ps1 -SiteUrl "https://tuorg.sharepoint.com/sites/RRHH"
# ============================================

param(
    [Parameter(Mandatory=$true)]
    [string]$SiteUrl
)

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " SEIDOR Vacaciones - Setup de SharePoint" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ── Conexión ──
Write-Host "[1/4] Conectando a SharePoint..." -ForegroundColor Yellow
try {
    Connect-PnPOnline -Url $SiteUrl -Interactive
    Write-Host "  ✅ Conectado a $SiteUrl" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Error conectando: $_" -ForegroundColor Red
    exit 1
}

# ── Lista de Aprobadores ──
Write-Host ""
Write-Host "[2/4] Creando lista 'Aprobadores'..." -ForegroundColor Yellow

$listApprovers = "Aprobadores"
try {
    $existingList = Get-PnPList -Identity $listApprovers -ErrorAction SilentlyContinue
    if ($existingList) {
        Write-Host "  ⚠️  La lista '$listApprovers' ya existe, saltando creación" -ForegroundColor DarkYellow
    } else {
        New-PnPList -Title $listApprovers -Template GenericList
        Write-Host "  ✅ Lista '$listApprovers' creada" -ForegroundColor Green

        # Columnas
        Add-PnPField -List $listApprovers -DisplayName "AzureUserId" -InternalName "AzureUserId" -Type Text -Required
        Add-PnPField -List $listApprovers -DisplayName "Email" -InternalName "Email" -Type Text -Required
        Add-PnPField -List $listApprovers -DisplayName "Department" -InternalName "Department" -Type Text -Required

        Write-Host "  ✅ Columnas agregadas a '$listApprovers'" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ Error: $_" -ForegroundColor Red
}

# ── Lista de Solicitudes ──
Write-Host ""
Write-Host "[3/4] Creando lista 'SolicitudesVacaciones'..." -ForegroundColor Yellow

$listRequests = "SolicitudesVacaciones"
try {
    $existingList = Get-PnPList -Identity $listRequests -ErrorAction SilentlyContinue
    if ($existingList) {
        Write-Host "  ⚠️  La lista '$listRequests' ya existe, saltando creación" -ForegroundColor DarkYellow
    } else {
        New-PnPList -Title $listRequests -Template GenericList
        Write-Host "  ✅ Lista '$listRequests' creada" -ForegroundColor Green

        # Columnas del solicitante
        Add-PnPField -List $listRequests -DisplayName "UserId" -InternalName "UserId" -Type Text -Required
        Add-PnPField -List $listRequests -DisplayName "UserName" -InternalName "UserName" -Type Text -Required
        Add-PnPField -List $listRequests -DisplayName "UserEmail" -InternalName "UserEmail" -Type Text -Required

        # Columnas del aprobador
        Add-PnPField -List $listRequests -DisplayName "ApproverId" -InternalName "ApproverId" -Type Text -Required
        Add-PnPField -List $listRequests -DisplayName "ApproverName" -InternalName "ApproverName" -Type Text -Required
        Add-PnPField -List $listRequests -DisplayName "ApproverEmail" -InternalName "ApproverEmail" -Type Text -Required

        # Fechas y duración
        Add-PnPField -List $listRequests -DisplayName "StartDate" -InternalName "StartDate" -Type DateTime -Required
        Add-PnPField -List $listRequests -DisplayName "EndDate" -InternalName "EndDate" -Type DateTime -Required
        Add-PnPField -List $listRequests -DisplayName "TotalDays" -InternalName "TotalDays" -Type Number -Required

        # Detalles
        Add-PnPField -List $listRequests -DisplayName "Reason" -InternalName "Reason" -Type Note -Required

        # Encargado de pendientes
        Add-PnPField -List $listRequests -DisplayName "BackupUserId" -InternalName "BackupUserId" -Type Text -Required
        Add-PnPField -List $listRequests -DisplayName "BackupUserName" -InternalName "BackupUserName" -Type Text -Required
        Add-PnPField -List $listRequests -DisplayName "BackupUserEmail" -InternalName "BackupUserEmail" -Type Text -Required
        Add-PnPField -List $listRequests -DisplayName "PendingTasks" -InternalName "PendingTasks" -Type Note

        # Estado
        $statusXml = '<Field Type="Choice" DisplayName="Status" Required="TRUE" Format="Dropdown" FillInChoice="FALSE">
            <Default>Pending</Default>
            <CHOICES>
                <CHOICE>Pending</CHOICE>
                <CHOICE>Approved</CHOICE>
                <CHOICE>Rejected</CHOICE>
            </CHOICES>
        </Field>'
        Add-PnPFieldFromXml -List $listRequests -FieldXml $statusXml

        # Comentarios del aprobador
        Add-PnPField -List $listRequests -DisplayName "ApproverComments" -InternalName "ApproverComments" -Type Note

        # Metadata
        Add-PnPField -List $listRequests -DisplayName "CreatedAt" -InternalName "CreatedAt" -Type DateTime -Required
        Add-PnPField -List $listRequests -DisplayName "UpdatedAt" -InternalName "UpdatedAt" -Type DateTime -Required

        Write-Host "  ✅ Columnas agregadas a '$listRequests'" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ Error: $_" -ForegroundColor Red
}

# ── Resumen ──
Write-Host ""
Write-Host "[4/4] Verificando..." -ForegroundColor Yellow

$site = Get-PnPSite
$siteId = (Get-PnPSite -Includes Id).Id

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host " ✅ Setup completado" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host " Site URL:  $SiteUrl" -ForegroundColor White
Write-Host " Site ID:   $siteId" -ForegroundColor White
Write-Host ""
Write-Host " Listas creadas:" -ForegroundColor White
Write-Host "   - Aprobadores" -ForegroundColor White
Write-Host "   - SolicitudesVacaciones" -ForegroundColor White
Write-Host ""
Write-Host " SIGUIENTE PASO:" -ForegroundColor Yellow
Write-Host " 1. Copia el Site ID al .env.local (SHAREPOINT_SITE_ID)" -ForegroundColor White
Write-Host " 2. Agrega aprobadores manualmente a la lista 'Aprobadores'" -ForegroundColor White
Write-Host "    (Title, AzureUserId, Email, Department)" -ForegroundColor Gray
Write-Host ""

# Desconectar
Disconnect-PnPOnline
