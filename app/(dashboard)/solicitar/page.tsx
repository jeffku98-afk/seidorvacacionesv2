// ============================================
// Solicitar Vacaciones - Formulario
// ============================================

"use client";

import { useState, useMemo } from "react";
import { Button } from "@heroui/react";
import { Send, RotateCcw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useApprovers, useCreateRequest } from "@/hooks/use-requests";
import { PageHeader } from "@/components/ui/page-header";
import { DatePicker } from "@/components/forms/date-picker";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { calculateTotalDays, formatDateLong, todayISO } from "@/lib/dates";
import { searchUsers } from "@/lib/graph-client";
import type { GraphUser } from "@/types";

export default function SolicitarPage() {
  const { user, getGraphClient } = useAuth();
  const { data: approvers, isLoading: loadingApprovers } = useApprovers();
  const createRequest = useCreateRequest();

  // Form state
  const [approverId, setApproverId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [backupUserId, setBackupUserId] = useState("");
  const [pendingTasks, setPendingTasks] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Backup user search
  const [backupSearch, setBackupSearch] = useState("");
  const [backupUsers, setBackupUsers] = useState<GraphUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedBackupUser, setSelectedBackupUser] = useState<GraphUser | null>(null);

  // Calculated days
  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const days = calculateTotalDays(startDate, endDate);
    return days > 0 ? days : 0;
  }, [startDate, endDate]);

  // Validation
  const isValid =
    approverId && startDate && endDate && reason.trim() && backupUserId && totalDays > 0;

  // Handlers
  const searchBackupUsers = async (query: string) => {
    setBackupSearch(query);
    if (query.length < 2) {
      setBackupUsers([]);
      return;
    }
    try {
      setSearchingUsers(true);
      const client = await getGraphClient();
      const users = await searchUsers(client, query);
      // Exclude current user
      setBackupUsers(users.filter((u) => u.id !== user?.id));
    } catch (error) {
      console.error("Error buscando usuarios:", error);
    } finally {
      setSearchingUsers(false);
    }
  };

  const resetForm = () => {
    setApproverId("");
    setStartDate("");
    setEndDate("");
    setReason("");
    setBackupUserId("");
    setBackupSearch("");
    setSelectedBackupUser(null);
    setPendingTasks("");
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (!isValid) return;

    const selectedApprover = approvers?.find((a) => a.userId === approverId);

    if (!selectedApprover || !selectedBackupUser) return;

    try {
      await createRequest.mutateAsync({
        approverId: selectedApprover.userId,
        approverName: selectedApprover.displayName,
        approverEmail: selectedApprover.email,
        startDate,
        endDate,
        totalDays,
        reason,
        backupUserId: selectedBackupUser.id,
        backupUserName: selectedBackupUser.displayName,
        backupUserEmail: selectedBackupUser.mail,
        pendingTasks,
      });

      setSubmitted(true);
      toast.success("¡Solicitud enviada correctamente!");
    } catch (error) {
      toast.error("Error al enviar la solicitud. Inténtalo de nuevo.");
      console.error(error);
    }
  };

  // ── Success screen ──
  if (submitted) {
    return (
      <div className="mx-auto max-w-[520px] pt-20 text-center animate-scale-in">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[20px] bg-gradient-to-br from-emerald-50 to-emerald-100 text-[40px] shadow-[0_8px_24px_rgba(34,197,94,0.12)]">
          ✈️
        </div>
        <h2 className="font-display text-2xl font-bold text-seidor-800 mb-2">
          ¡Solicitud Enviada!
        </h2>
        <p className="text-muted text-[15px] mb-2">
          Tu solicitud de vacaciones ha sido enviada correctamente.
        </p>

        <div className="my-6 flex flex-col gap-2.5 rounded-xl bg-seidor-50 p-4 text-left">
          <div className="flex items-center gap-2.5 text-[13px] text-seidor-800">
            <span className="text-seidor-400">📧</span>
            Se envió un correo al aprobador con copia al encargado de pendientes
          </div>
          <div className="flex items-center gap-2.5 text-[13px] text-seidor-800">
            <span className="text-seidor-400">💬</span>
            Se envió una notificación vía Microsoft Teams al aprobador
          </div>
          <div className="flex items-center gap-2.5 text-[13px] text-seidor-800">
            <span className="text-seidor-400">📋</span>
            La solicitud fue registrada en la Lista de SharePoint
          </div>
        </div>

        <Button
          color="primary"
          className="btn-primary"
          onPress={resetForm}
          startContent={<RotateCcw size={16} />}
        >
          Crear otra solicitud
        </Button>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="mx-auto max-w-[700px] animate-fade-in">
      <PageHeader
        icon="🏖️"
        iconGradient="from-seidor-500 to-seidor-400"
        title="Solicitar Vacaciones"
        subtitle="Completa todos los campos para enviar tu solicitud"
      />

      <div className="card-base overflow-hidden">
        <div className="flex flex-col gap-5 p-7">
          {/* Approver */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-seidor-800 tracking-wide">
              Aprobador de Vacaciones <span className="text-red-500">*</span>
            </label>
            {loadingApprovers ? (
              <LoadingSpinner size="sm" />
            ) : (
              <select
                value={approverId}
                onChange={(e) => setApproverId(e.target.value)}
                className="input-field cursor-pointer"
                aria-label="Aprobador"
              >
                <option value="">Seleccionar aprobador...</option>
                {(approvers ?? []).map((a) => (
                  <option key={a.userId} value={a.userId}>
                    {a.displayName} — {a.department}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              label="Fecha Inicio"
              value={startDate}
              onChange={(d) => {
                setStartDate(d);
                // Reset end if before start
                if (endDate && d > endDate) setEndDate("");
              }}
              isRequired
              minDate={todayISO()}
            />
            <DatePicker
              label="Fecha Fin"
              value={endDate}
              onChange={setEndDate}
              isRequired
              minDate={startDate || todayISO()}
            />
          </div>

          {/* Day count */}
          {totalDays > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-seidor-200/40 bg-gradient-to-br from-seidor-50 to-seidor-50/50 px-5 py-3.5 animate-scale-in">
              <span className="text-[22px]">📅</span>
              <div>
                <span className="font-display text-[22px] font-bold text-seidor-500">
                  {totalDays}
                </span>
                <span className="ml-1.5 text-sm text-muted">
                  días calendario
                </span>
              </div>
              <span className="ml-auto rounded-lg bg-white/70 px-2.5 py-1 text-[11px] text-muted">
                Incluye sáb. y dom.
              </span>
            </div>
          )}

          {/* Reason */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-seidor-800 tracking-wide">
              Motivo <span className="text-red-500">*</span>
            </label>
            <textarea
              className="input-field"
              placeholder="Describe brevemente el motivo de tu solicitud..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          {/* Backup user */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-seidor-800 tracking-wide">
              Encargado de Pendientes <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Buscar compañero por nombre..."
              value={backupSearch}
              onChange={(e) => searchBackupUsers(e.target.value)}
            />
            {searchingUsers && <LoadingSpinner size="sm" />}
            {backupUsers.length > 0 && !backupUserId && (
              <div className="rounded-xl border border-[#E2E8F4] bg-white shadow-md overflow-hidden">
                {backupUsers.slice(0, 5).map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setBackupUserId(u.id);
                      setBackupSearch(u.displayName);
                      setSelectedBackupUser(u);
                      setBackupUsers([]);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-seidor-50 border-b border-[#E2E8F4] last:border-b-0"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-seidor-200 to-seidor-300 text-xs font-bold text-white">
                      {u.displayName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-seidor-800">
                        {u.displayName}
                      </div>
                      <div className="text-xs text-muted">{u.mail}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {backupUserId && (
              <div className="flex items-center gap-2 text-sm text-seidor-500">
                <CheckCircle2 size={14} />
                <span className="font-medium">{backupSearch}</span>
                <button
                  onClick={() => {
                    setBackupUserId("");
                    setBackupSearch("");
                    setSelectedBackupUser(null);
                  }}
                  className="ml-auto text-xs text-muted hover:text-red-500"
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>

          {/* Pending tasks */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-seidor-800 tracking-wide">
              Tareas Pendientes
            </label>
            <textarea
              className="input-field"
              placeholder="Lista de tareas pendientes que quedarán a cargo..."
              value={pendingTasks}
              onChange={(e) => setPendingTasks(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-[#E2E8F4] bg-[#F4F7FB]/50 px-7 py-4">
          <Button
            variant="bordered"
            onPress={resetForm}
            startContent={<RotateCcw size={14} />}
          >
            Limpiar
          </Button>
          <Button
            color="primary"
            className="btn-primary"
            isDisabled={!isValid}
            isLoading={createRequest.isPending}
            onPress={handleSubmit}
            startContent={!createRequest.isPending && <Send size={14} />}
          >
            Enviar Solicitud
          </Button>
        </div>
      </div>
    </div>
  );
}