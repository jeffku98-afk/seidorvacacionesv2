// ============================================
// Hooks de Solicitudes de Vacaciones (TanStack Query)
// ============================================

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import {
  getAllRequests,
  getUserRequests,
  getPendingApprovals,
  getApprovedRequests,
  getApprovers,
  createRequest,
  updateRequestStatus,
} from "@/lib/sharepoint";
import {
  notifyNewRequest,
  notifyRequestApproved,
  notifyRequestRejected,
} from "@/lib/notifications";
import type {
  CreateVacationRequest,
  VacationRequest,
} from "@/types";

// ─── Query Keys ─────────────────────────────────

export const queryKeys = {
  requests: {
    all: ["requests"] as const,
    mine: (userId: string) => ["requests", "mine", userId] as const,
    pending: (email: string) => ["requests", "pending", email] as const,
    approved: ["requests", "approved"] as const,
  },
  approvers: ["approvers"] as const,
};

// ─── QUERIES ────────────────────────────────────

/**
 * Obtiene la lista de aprobadores desde SharePoint
 */
export function useApprovers() {
  const { getGraphClient, siteId, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.approvers,
    queryFn: async () => {
      const client = await getGraphClient();
      return getApprovers(client, siteId!);
    },
    enabled: isAuthenticated && !!siteId,
  });
}

/**
 * Obtiene las solicitudes del usuario actual
 */
export function useMyRequests() {
  const { user, getGraphClient, siteId, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.requests.mine(user?.id || ""),
    queryFn: async () => {
      const client = await getGraphClient();
      return getUserRequests(client, siteId!, user!.id);
    },
    enabled: isAuthenticated && !!siteId && !!user,
  });
}

/**
 * Obtiene solicitudes pendientes de aprobación (para aprobadores)
 */
export function usePendingApprovals() {
  const { user, getGraphClient, siteId, isAuthenticated, isApprover } = useAuth();

  return useQuery({
    queryKey: queryKeys.requests.pending(user?.email || ""),
    queryFn: async () => {
      const client = await getGraphClient();
      return getPendingApprovals(client, siteId!, user!.email);
    },
    enabled: isAuthenticated && !!siteId && !!user && isApprover,
  });
}

/**
 * Obtiene todas las solicitudes aprobadas (para el calendario)
 */
export function useApprovedRequests() {
  const { getGraphClient, siteId, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.requests.approved,
    queryFn: async () => {
      const client = await getGraphClient();
      return getApprovedRequests(client, siteId!);
    },
    enabled: isAuthenticated && !!siteId,
  });
}

/**
 * Obtiene TODAS las solicitudes (para la vista del aprobador)
 */
export function useAllRequests() {
  const { getGraphClient, siteId, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.requests.all,
    queryFn: async () => {
      const client = await getGraphClient();
      return getAllRequests(client, siteId!);
    },
    enabled: isAuthenticated && !!siteId,
  });
}

// ─── MUTATIONS ──────────────────────────────────

/**
 * Crea una nueva solicitud de vacaciones
 * 1. Guarda en SharePoint
 * 2. Envía correo al aprobador (CC backup)
 * 3. Envía notificación Teams al aprobador
 */
export function useCreateRequest() {
  const { user, getGraphClient, siteId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVacationRequest) => {
      const client = await getGraphClient();

      // 1. Crear en SharePoint
      const request = await createRequest(client, siteId!, user!, data);

      // 2. Enviar notificaciones (email + Teams)
      try {
        await notifyNewRequest(client, request);
      } catch (notifError) {
        console.error("Error enviando notificaciones:", notifError);
        // No fallar la mutación por errores de notificación
      }

      return request;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.requests.mine(user!.id),
      });
    },
  });
}

/**
 * Aprueba una solicitud de vacaciones
 * 1. Actualiza en SharePoint
 * 2. Envía correo al solicitante
 * 3. Envía notificación Teams al solicitante
 */
export function useApproveRequest() {
  const { user, getGraphClient, siteId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      request,
      comments,
    }: {
      request: VacationRequest;
      comments?: string;
    }) => {
      const client = await getGraphClient();

      // 1. Actualizar estado en SharePoint
      await updateRequestStatus(
        client,
        siteId!,
        request.id,
        "approved",
        comments
      );

      // 2. Enviar notificaciones
      const updatedRequest = {
        ...request,
        status: "approved" as const,
        approverComments: comments,
      };

      try {
        await notifyRequestApproved(client, updatedRequest);
      } catch (notifError) {
        console.error("Error enviando notificaciones:", notifError);
      }

      return updatedRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.requests.pending(user!.email),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.requests.approved,
      });
    },
  });
}

/**
 * Rechaza una solicitud de vacaciones
 */
export function useRejectRequest() {
  const { user, getGraphClient, siteId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      request,
      comments,
    }: {
      request: VacationRequest;
      comments?: string;
    }) => {
      const client = await getGraphClient();

      // 1. Actualizar estado en SharePoint
      await updateRequestStatus(
        client,
        siteId!,
        request.id,
        "rejected",
        comments
      );

      // 2. Enviar notificaciones
      const updatedRequest = {
        ...request,
        status: "rejected" as const,
        approverComments: comments,
      };

      try {
        await notifyRequestRejected(client, updatedRequest);
      } catch (notifError) {
        console.error("Error enviando notificaciones:", notifError);
      }

      return updatedRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.requests.pending(user!.email),
      });
    },
  });
}
