// ============================================
// Servicio de SharePoint para Solicitudes de Vacaciones
// ============================================
// Operaciones CRUD sobre las listas de SharePoint
//
// LISTAS REQUERIDAS EN SHAREPOINT:
//
// 1. "SolicitudesVacaciones" con columnas:
//    - Title (Single line - ID de solicitud)
//    - UserId (Single line)
//    - UserName (Single line)
//    - UserEmail (Single line)
//    - ApproverId (Single line)
//    - ApproverName (Single line)
//    - ApproverEmail (Single line)
//    - StartDate (Date only)
//    - EndDate (Date only)
//    - TotalDays (Number)
//    - Reason (Multiple lines)
//    - BackupUserId (Single line)
//    - BackupUserName (Single line)
//    - BackupUserEmail (Single line)
//    - PendingTasks (Multiple lines)
//    - Status (Choice: Pending, Approved, Rejected)
//    - ApproverComments (Multiple lines)
//    - CreatedAt (Date and time)
//    - UpdatedAt (Date and time)
//
// 2. "Aprobadores" con columnas:
//    - Title (Single line - Nombre)
//    - AzureUserId (Single line)
//    - Email (Single line)
//    - Department (Single line)
// ============================================

import { Client } from "@microsoft/microsoft-graph-client";
import {
  getListItems,
  createListItem,
  updateListItem,
} from "./graph-client";
import type {
  VacationRequest,
  CreateVacationRequest,
  Approver,
  AppUser,
  SPVacationRequestItem,
  SPApproverItem,
  RequestStatus,
} from "@/types";

const LIST_REQUESTS =
  process.env.NEXT_PUBLIC_SP_LIST_SOLICITUDES || "SolicitudesVacaciones";
const LIST_APPROVERS =
  process.env.NEXT_PUBLIC_SP_LIST_APROBADORES || "Aprobadores";

// ─── HELPERS ────────────────────────────────────

/** Genera un ID único de solicitud: REQ-YYYYMMDD-XXXX */
function generateRequestId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REQ-${date}-${rand}`;
}

/** Mapea un item de SharePoint al tipo VacationRequest */
function mapSPItemToRequest(item: any): VacationRequest {
  return {
    id: item.id,
    userId: item.UserId,
    userName: item.UserName,
    userEmail: item.UserEmail,
    approverId: item.ApproverId,
    approverName: item.ApproverName,
    approverEmail: item.ApproverEmail,
    startDate: item.StartDate,
    endDate: item.EndDate,
    totalDays: item.TotalDays,
    reason: item.Reason,
    backupUserId: item.BackupUserId,
    backupUserName: item.BackupUserName,
    backupUserEmail: item.BackupUserEmail,
    pendingTasks: item.PendingTasks,
    status: (item.Status?.toLowerCase() || "pending") as RequestStatus,
    approverComments: item.ApproverComments,
    createdAt: item.CreatedAt,
    updatedAt: item.UpdatedAt,
  };
}

/** Mapea un item de SharePoint al tipo Approver */
function mapSPItemToApprover(item: any): Approver {
  return {
    id: item.id,
    userId: item.AzureUserId,
    displayName: item.Title,
    email: item.Email,
    department: item.Department,
  };
}

// ─── APROBADORES ────────────────────────────────

/**
 * Obtiene la lista de aprobadores definidos en SharePoint
 */
export async function getApprovers(
  client: Client,
  siteId: string
): Promise<Approver[]> {
  const items = await getListItems<SPApproverItem>(
    client,
    siteId,
    LIST_APPROVERS
  );
  return items.map(mapSPItemToApprover);
}

/**
 * Verifica si un usuario es aprobador
 */
export async function isUserApprover(
  client: Client,
  siteId: string,
  userEmail: string
): Promise<boolean> {
  const approvers = await getApprovers(client, siteId);
  return approvers.some(
    (a) => a.email.toLowerCase() === userEmail.toLowerCase()
  );
}

// ─── SOLICITUDES ────────────────────────────────

/**
 * Obtiene todas las solicitudes de vacaciones
 */
export async function getAllRequests(
  client: Client,
  siteId: string
): Promise<VacationRequest[]> {
  const items = await getListItems<SPVacationRequestItem>(
    client,
    siteId,
    LIST_REQUESTS
  );
  return items.map(mapSPItemToRequest);
}

/**
 * Obtiene las solicitudes de un usuario específico
 */
export async function getUserRequests(
  client: Client,
  siteId: string,
  userId: string
): Promise<VacationRequest[]> {
  const items = await getListItems<SPVacationRequestItem>(
    client,
    siteId,
    LIST_REQUESTS,
    `fields/UserId eq '${userId}'`
  );
  return items.map(mapSPItemToRequest);
}

/**
 * Obtiene las solicitudes pendientes para un aprobador
 */
export async function getPendingApprovals(
  client: Client,
  siteId: string,
  approverEmail: string
): Promise<VacationRequest[]> {
  const items = await getListItems<SPVacationRequestItem>(
    client,
    siteId,
    LIST_REQUESTS,
    `fields/ApproverEmail eq '${approverEmail}' and fields/Status eq 'Pending'`
  );
  return items.map(mapSPItemToRequest);
}

/**
 * Obtiene solicitudes aprobadas (para el calendario)
 */
export async function getApprovedRequests(
  client: Client,
  siteId: string
): Promise<VacationRequest[]> {
  const items = await getListItems<SPVacationRequestItem>(
    client,
    siteId,
    LIST_REQUESTS,
    `fields/Status eq 'Approved'`
  );
  return items.map(mapSPItemToRequest);
}

/**
 * Crea una nueva solicitud de vacaciones en SharePoint
 */
export async function createRequest(
  client: Client,
  siteId: string,
  user: AppUser,
  data: CreateVacationRequest
): Promise<VacationRequest> {
  const now = new Date().toISOString();
  const requestId = generateRequestId();

  const fields: SPVacationRequestItem = {
    Title: requestId,
    UserId: user.id,
    UserName: user.displayName,
    UserEmail: user.email,
    ApproverId: data.approverId,
    ApproverName: data.approverName,
    ApproverEmail: data.approverEmail,
    StartDate: data.startDate,
    EndDate: data.endDate,
    TotalDays: data.totalDays,
    Reason: data.reason,
    BackupUserId: data.backupUserId,
    BackupUserName: data.backupUserName,
    BackupUserEmail: data.backupUserEmail,
    PendingTasks: data.pendingTasks,
    Status: "Pending",
    ApproverComments: "",
    CreatedAt: now,
    UpdatedAt: now,
  };

  const result = await createListItem(client, siteId, LIST_REQUESTS, fields);
  return mapSPItemToRequest(result);
}

/**
 * Actualiza el estado de una solicitud (aprobar/rechazar)
 */
export async function updateRequestStatus(
  client: Client,
  siteId: string,
  itemId: string,
  status: "approved" | "rejected",
  comments?: string
): Promise<void> {
  const statusValue = status === "approved" ? "Approved" : "Rejected";
  const now = new Date().toISOString();

  await updateListItem(client, siteId, LIST_REQUESTS, itemId, {
    Status: statusValue,
    ApproverComments: comments || "",
    UpdatedAt: now,
  });
}
