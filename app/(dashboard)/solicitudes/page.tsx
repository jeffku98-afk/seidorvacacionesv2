// ============================================
// Mis Solicitudes - Dashboard + Lista
// ============================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { PlusCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAllRequests } from "@/hooks/use-requests";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDateShort } from "@/lib/dates";
import type { RequestStatus, VacationRequest } from "@/types";

const FILTER_OPTIONS: { key: "all" | RequestStatus; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Pendientes" },
  { key: "approved", label: "Aprobadas" },
  { key: "rejected", label: "Rechazadas" },
];

export default function SolicitudesPage() {
  const { user, isApprover } = useAuth();
  const { data: allRequests, isLoading } = useAllRequests();
  const [filter, setFilter] = useState<"all" | RequestStatus>("all");

  // Filtrar solicitudes del usuario actual
  const myRequests = (allRequests ?? []).filter(
    (r) => r.userEmail?.toLowerCase() === user?.email?.toLowerCase()
  );
  const filtered =
    filter === "all" ? myRequests : myRequests.filter((r) => r.status === filter);

  const pending = myRequests.filter((r) => r.status === "pending").length;
  const approved = myRequests.filter((r) => r.status === "approved").length;
  const totalDays = myRequests
    .filter((r) => r.status === "approved")
    .reduce((s, r) => s + r.totalDays, 0);

  // Contar pendientes de aprobación (solo si es aprobador)
  const pendingApprovalCount = isApprover
    ? (allRequests ?? []).filter(
        (r) => r.status === "pending" && r.approverEmail?.toLowerCase() === user?.email?.toLowerCase()
      ).length
    : 0;

  const stats = [
    { label: "Días Aprobados", value: totalDays, icon: "☀️", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Pendientes", value: pending, icon: "⏳", color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Aprobadas", value: approved, icon: "✅", color: "text-emerald-600", bg: "bg-emerald-50" },
    ...(isApprover
      ? [{ label: "Por Aprobar", value: pendingApprovalCount, icon: "📋", color: "text-seidor-400", bg: "bg-seidor-50" }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-[960px] animate-fade-in">
      {/* Greeting */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[32px] animate-[float_3s_ease-in-out_infinite]">👋</span>
          <h1 className="font-display text-[28px] font-bold text-seidor-800">
            ¡Hola, {user?.displayName?.split(" ")[0]}!
          </h1>
        </div>
        <p className="ml-[52px] text-[15px] text-muted">
          Bienvenido al Portal de Vacaciones SEIDOR
        </p>
      </div>

      {/* Stats */}
      <div
        className="mb-8 grid gap-4"
        style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}
      >
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`card-hover px-6 py-5 stagger-${i + 1} animate-fade-in`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[28px]">{s.icon}</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.bg} ${s.color}`}
              >
                {s.label}
              </span>
            </div>
            <div className="font-display text-4xl font-bold text-seidor-800">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        <Link href="/solicitar">
          <div className="card-hover cursor-pointer overflow-hidden p-0 transition-all">
            <div className="bg-gradient-to-br from-seidor-50 to-white px-7 py-6">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br from-seidor-500 to-seidor-400 text-[22px] shadow-md">
                  🏖️
                </div>
                <div>
                  <div className="font-display text-[17px] font-bold text-seidor-800">
                    Solicitar Vacaciones
                  </div>
                  <div className="mt-0.5 text-[13px] text-muted">
                    Crear una nueva solicitud
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
        <Link href="/calendario">
          <div className="card-hover cursor-pointer overflow-hidden p-0 transition-all">
            <div className="bg-gradient-to-br from-emerald-50/50 to-white px-7 py-6">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br from-emerald-600 to-emerald-400 text-[22px] shadow-md">
                  📅
                </div>
                <div>
                  <div className="font-display text-[17px] font-bold text-seidor-800">
                    Calendario
                  </div>
                  <div className="mt-0.5 text-[13px] text-muted">
                    Ver vacaciones del equipo
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Request list */}
      <div className="card-base overflow-hidden animate-fade-in stagger-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F4] px-6 py-5">
          <h3 className="font-display text-base font-semibold text-seidor-800">
            Mis Solicitudes
          </h3>
          <div className="flex gap-1.5">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-lg border-[1.5px] px-3.5 py-[5px] text-[13px] font-medium transition-all ${
                  filter === f.key
                    ? "border-seidor-400 bg-seidor-50 text-seidor-500 font-semibold"
                    : "border-[#E2E8F4] text-muted hover:border-seidor-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-4 text-5xl">🏝️</div>
            <p className="text-muted">
              {filter === "all"
                ? "Aún no tienes solicitudes. ¡Es momento de planear unas vacaciones!"
                : "No se encontraron solicitudes con este filtro"}
            </p>
            {filter === "all" && (
              <Link href="/solicitar">
                <Button
                  color="primary"
                  variant="flat"
                  className="mt-4"
                  startContent={<PlusCircle size={16} />}
                >
                  Solicitar Vacaciones
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div>
            {filtered.map((r, i) => (
              <div
                key={r.id}
                className="flex items-stretch border-b border-[#E2E8F4] last:border-b-0 transition-colors hover:bg-seidor-50/30"
              >
                {/* Status bar */}
                <div
                  className={`w-[5px] shrink-0 rounded-l ${
                    r.status === "approved"
                      ? "bg-emerald-500"
                      : r.status === "rejected"
                        ? "bg-red-500"
                        : "bg-amber-500"
                  }`}
                />
                {/* Content */}
                <div className="flex flex-1 items-center gap-5 px-6 py-4">
                  <div className="grid flex-1 grid-cols-[1.5fr_1fr_1fr_auto] items-center gap-4">
                    <div>
                      <div className="mb-1 text-[11px] font-medium text-muted">
                        {r.id} · {formatDateShort(r.createdAt)}
                      </div>
                      <div className="text-[15px] font-semibold text-seidor-800">
                        {formatDateShort(r.startDate)} —{" "}
                        {formatDateShort(r.endDate)}
                      </div>
                      <div className="mt-0.5 text-[13px] text-muted">
                        {r.reason}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-[11px] font-medium text-muted">
                        Aprobador
                      </div>
                      <div className="text-[13px] font-medium text-seidor-800">
                        {r.approverName}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-[11px] font-medium text-muted">
                        Días
                      </div>
                      <div className="font-display text-xl font-bold text-seidor-500">
                        {r.totalDays}
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}