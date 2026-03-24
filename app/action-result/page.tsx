// ============================================
// Resultado de Acción - Página de confirmación
// ============================================
// El usuario llega aquí después de hacer clic en
// "Aprobar" o "Rechazar" desde el correo electrónico
// ============================================

"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function ActionResultContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "info";
  const message = searchParams.get("message") || "Acción procesada";

  const config: Record<string, { icon: string; bg: string; title: string }> = {
    success: {
      icon: "✅",
      bg: "from-emerald-500 to-emerald-400",
      title: "¡Acción Completada!",
    },
    error: {
      icon: "❌",
      bg: "from-red-500 to-red-400",
      title: "Error",
    },
    info: {
      icon: "ℹ️",
      bg: "from-seidor-400 to-seidor-300",
      title: "Información",
    },
  };

  const c = config[type] || config.info;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-seidor-500 via-[#2A3890] to-seidor-400">
      <div className="card-base w-[440px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-scale-in">
        <div
          className={`bg-gradient-to-br ${c.bg} px-9 py-8 text-center`}
        >
          <div className="text-5xl mb-3">{c.icon}</div>
          <h1 className="font-display text-2xl font-bold text-white">
            {c.title}
          </h1>
        </div>
        <div className="px-9 py-8 text-center">
          <p className="text-seidor-800 text-[15px] leading-relaxed mb-6">
            {message}
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/aprobaciones"
              className="btn-primary justify-center w-full text-center"
            >
              Ir al Portal de Vacaciones
            </Link>
            <p className="text-xs text-muted mt-2">
              Puedes cerrar esta ventana si no necesitas hacer nada más.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActionResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-seidor-500 via-[#2A3890] to-seidor-400">
          <div className="text-white text-lg">Cargando...</div>
        </div>
      }
    >
      <ActionResultContent />
    </Suspense>
  );
}
