// ============================================
// Aprobaciones - Gestión de Solicitudes Pendientes
// ============================================

"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { CheckCircle2, XCircle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import {
  useAllRequests,
  useApproveRequest,
  useRejectRequest,
} from "@/hooks/use-requests";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDateShort } from "@/lib/dates";
import type { VacationRequest } from "@/types";

export default function AprobacionesPage() {
  const { user, isApprover } = useAuth();
  const { data: allRequests, isLoading: loadingAll } = useAllRequests();
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();

  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [comments, setComments] = useState("");
  const [actionRequest, setActionRequest] = useState<VacationRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Guard: only approvers
  if (!isApprover) {
    return (
      <div className="mx-auto max-w-[600px] pt-20 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="font-display text-xl font-bold text-seidor-800 mb-2">
          Acceso Restringido
        </h2>
        <p className="text-muted">
          Esta sección solo está disponible para usuarios con rol de Aprobador.
        </p>
      </div>
    );
  }

  // Filtrar solicitudes: pendientes para este aprobador vs historial
  const all = allRequests ?? [];
  const pending = all.filter(
    (r) => r.status === "pending" && r.approverEmail?.toLowerCase() === user?.email?.toLowerCase()
  );
  const history = all.filter((r) => r.status !== "pending");
  const list = tab === "pending" ? pending : history;
  const isLoading = loadingAll;

  const openAction = (request: VacationRequest, type: "approve" | "reject") => {
    setActionRequest(request);
    setActionType(type);
    setComments("");
    setIsModalOpen(true);
  };

  const handleAction = async () => {
    if (!actionRequest || !actionType) return;

    try {
      if (actionType === "approve") {
        await approveRequest.mutateAsync({
          request: actionRequest,
          comments,
        });
        toast.success("Solicitud aprobada ✈️");
      } else {
        await rejectRequest.mutateAsync({
          request: actionRequest,
          comments,
        });
        toast.error("Solicitud rechazada");
      }
      setIsModalOpen(false);
      setExpandedId(null);
    } catch (error) {
      toast.error("Error al procesar la solicitud");
      console.error(error);
    }
  };

  return (
    <div className="mx-auto max-w-[900px] animate-fade-in">
      <PageHeader
        icon="✅"
        iconGradient="from-amber-400 to-amber-300"
        title="Aprobaciones"
        subtitle={`${pending.length} solicitudes pendientes`}
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-0 border-b-2 border-[#E2E8F4]">
        {[
          { key: "pending" as const, label: `Pendientes (${pending.length})` },
          { key: "history" as const, label: "Historial" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-[2px] border-b-2 px-6 py-3 text-sm font-medium transition-all ${
              tab === t.key
                ? "border-seidor-400 text-seidor-500 font-semibold"
                : "border-transparent text-muted hover:text-seidor-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : list.length === 0 ? (
        <div className="card-base py-16 text-center">
          <div className="mb-4 text-5xl">
            {tab === "pending" ? "🎉" : "📂"}
          </div>
          <p className="text-muted text-[15px]">
            {tab === "pending"
              ? "¡No hay solicitudes pendientes!"
              : "Sin historial de aprobaciones"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((r, i) => (
            <div
              key={r.id}
              className={`card-base overflow-hidden animate-slide-in stagger-${Math.min(i + 1, 4)}`}
            >
              {/* Header row */}
              <button
                className="flex w-full items-center gap-4 px-6 py-5 text-left"
                onClick={() =>
                  setExpandedId(expandedId === r.id ? null : r.id)
                }
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-seidor-200 to-seidor-300 text-sm font-bold text-white">
                  {r.userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-seidor-800">
                      {r.userName}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="mt-1 text-[13px] text-muted">
                    {formatDateShort(r.startDate)} — {formatDateShort(r.endDate)}{" "}
                    · {r.totalDays} días · {r.reason}
                  </div>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-muted transition-transform duration-200 ${
                    expandedId === r.id ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Expanded details */}
              {expandedId === r.id && (
                <div className="animate-scale-in border-t border-[#E2E8F4] px-6 pb-5 pt-4">
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        Encargado de Pendientes
                      </span>
                      <div className="mt-1 text-sm text-seidor-800">
                        {r.backupUserName}
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        ID Solicitud
                      </span>
                      <div className="mt-1 text-sm text-seidor-800">
                        {r.id}
                      </div>
                    </div>
                  </div>

                  {r.pendingTasks && (
                    <div className="mb-4">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        Tareas Pendientes
                      </span>
                      <div className="mt-1 rounded-lg bg-[#F4F7FB] p-3 text-sm leading-relaxed text-seidor-800">
                        {r.pendingTasks}
                      </div>
                    </div>
                  )}

                  {r.approverComments && (
                    <div className="mb-4">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        Comentarios del Aprobador
                      </span>
                      <div className="mt-1 rounded-lg bg-seidor-50 p-3 text-sm leading-relaxed text-seidor-800">
                        {r.approverComments}
                      </div>
                    </div>
                  )}

                  {r.status === "pending" && (
                    <div className="flex justify-end gap-2.5">
                      <Button
                        color="danger"
                        variant="flat"
                        size="sm"
                        startContent={<XCircle size={14} />}
                        onPress={() => openAction(r, "reject")}
                      >
                        Rechazar
                      </Button>
                      <Button
                        color="success"
                        size="sm"
                        startContent={<CheckCircle2 size={14} />}
                        onPress={() => openAction(r, "approve")}
                        className="font-semibold"
                      >
                        Aprobar
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="card-base w-[440px] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[#E2E8F4] px-6 py-4">
              <h3 className="font-display text-lg font-semibold">
                {actionType === "approve"
                  ? "✅ Confirmar Aprobación"
                  : "❌ Confirmar Rechazo"}
              </h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-muted mb-4">
                {actionType === "approve"
                  ? `¿Estás seguro de aprobar la solicitud de ${actionRequest?.userName}?`
                  : `¿Estás seguro de rechazar la solicitud de ${actionRequest?.userName}?`}
              </p>
              <label className="text-[13px] font-semibold text-seidor-800">
                Comentarios (opcional)
              </label>
              <textarea
                className="input-field mt-1.5"
                rows={2}
                placeholder={
                  actionType === "approve"
                    ? "Agrega un comentario..."
                    : "Motivo del rechazo..."
                }
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2.5 border-t border-[#E2E8F4] px-6 py-4">
              <Button variant="light" onPress={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                color={actionType === "approve" ? "success" : "danger"}
                onPress={handleAction}
                isLoading={
                  approveRequest.isPending || rejectRequest.isPending
                }
              >
                {actionType === "approve" ? "Aprobar" : "Rechazar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}