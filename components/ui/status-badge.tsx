// ============================================
// Badge de Estado de Solicitud
// ============================================

import type { RequestStatus } from "@/types";

const config: Record<
  RequestStatus,
  { bg: string; text: string; label: string; icon: string }
> = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    label: "Pendiente",
    icon: "⏳",
  },
  approved: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    label: "Aprobada",
    icon: "✓",
  },
  rejected: {
    bg: "bg-red-50",
    text: "text-red-800",
    label: "Rechazada",
    icon: "✗",
  },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const c = config[status];
  return (
    <span
      className={`badge ${c.bg} ${c.text}`}
    >
      <span className="text-[10px]">{c.icon}</span>
      {c.label}
    </span>
  );
}
