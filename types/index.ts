// ============================================
// SEIDOR Vacaciones - Definiciones de Tipos
// ============================================

/** Estado de una solicitud de vacaciones */
export type RequestStatus = "pending" | "approved" | "rejected";

/** Rol de usuario en la app */
export type UserRole = "user" | "approver";

/** Usuario autenticado vía Azure AD */
export interface AppUser {
  id: string;
  displayName: string;
  email: string;
  department?: string;
  jobTitle?: string;
  role: UserRole;
  photoUrl?: string;
}

/** Usuario aprobador (de la lista de SharePoint) */
export interface Approver {
  id: string;              // ID del item en SharePoint
  userId: string;          // Azure AD Object ID
  displayName: string;
  email: string;
  department: string;
}

/** Solicitud de vacaciones */
export interface VacationRequest {
  id: string;              // ID del item en SharePoint
  // Solicitante
  userId: string;
  userName: string;
  userEmail: string;
  // Aprobador
  approverId: string;
  approverName: string;
  approverEmail: string;
  // Detalles
  startDate: string;       // ISO date: YYYY-MM-DD
  endDate: string;
  totalDays: number;
  reason: string;
  // Encargado de pendientes
  backupUserId: string;
  backupUserName: string;
  backupUserEmail: string;
  pendingTasks: string;
  // Estado
  status: RequestStatus;
  approverComments?: string;
  // Metadata
  createdAt: string;       // ISO datetime
  updatedAt: string;
}

/** Payload para crear una nueva solicitud */
export interface CreateVacationRequest {
  approverId: string;
  approverName: string;
  approverEmail: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  backupUserId: string;
  backupUserName: string;
  backupUserEmail: string;
  pendingTasks: string;
}

/** Payload para aprobar/rechazar */
export interface UpdateRequestStatus {
  requestId: string;
  status: "approved" | "rejected";
  comments?: string;
}

/** Columnas de la lista de SharePoint: SolicitudesVacaciones */
export interface SPVacationRequestItem {
  Title: string;                // ID de la solicitud (REQ-XXXX)
  UserId: string;
  UserName: string;
  UserEmail: string;
  ApproverId: string;
  ApproverName: string;
  ApproverEmail: string;
  StartDate: string;
  EndDate: string;
  TotalDays: number;
  Reason: string;
  BackupUserId: string;
  BackupUserName: string;
  BackupUserEmail: string;
  PendingTasks: string;
  Status: string;               // Pending | Approved | Rejected
  ApproverComments: string;
  CreatedAt: string;
  UpdatedAt: string;
}

/** Columnas de la lista de SharePoint: Aprobadores */
export interface SPApproverItem {
  Title: string;                // Nombre del aprobador
  AzureUserId: string;
  Email: string;
  Department: string;
}

/** Resultado de búsqueda de usuarios en Microsoft Graph */
export interface GraphUser {
  id: string;
  displayName: string;
  mail: string;
  department?: string;
  jobTitle?: string;
}

/** Notificación (correo o Teams) */
export interface NotificationPayload {
  to: string[];
  cc?: string[];
  subject: string;
  bodyHtml: string;
  teamsMessage?: string;
  teamsUserId?: string;
}
