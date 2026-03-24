// ============================================
// Página de Login - Autenticación con Microsoft
// ============================================

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@heroui/react";

export default function LoginPage() {
  const { login, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/solicitudes");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-seidor-500 via-[#2A3890] to-seidor-400">
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-seidor-200/[0.08] animate-[float_6s_ease-in-out_infinite]" />
      <div className="absolute -bottom-14 -left-14 w-52 h-52 rounded-full bg-seidor-400/[0.12] animate-[float_8s_ease-in-out_infinite_1s]" />
      <div className="absolute top-[20%] left-[15%] text-6xl opacity-[0.06] animate-[float_7s_ease-in-out_infinite_0.5s]">
        ✈️
      </div>
      <div className="absolute bottom-[25%] right-[10%] text-5xl opacity-[0.06] animate-[float_9s_ease-in-out_infinite_2s]">
        🌴
      </div>
      <div className="absolute top-[60%] left-[8%] text-4xl opacity-[0.05] animate-[float_5s_ease-in-out_infinite_1.5s]">
        ☀️
      </div>

      <div className="card-base w-[420px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-scale-in">
        {/* Header */}
        <div className="px-9 pt-9 pb-7 text-center bg-gradient-to-br from-seidor-50 to-white border-b border-[#E2E8F4]">
          <img
            src="/logo.png"
            alt="SEIDOR"
            className="mx-auto mb-4 h-12 object-contain translate-x-2"
          />
          <p className="text-sm text-muted font-medium mt-1 tracking-widest uppercase">
            Portal de Vacaciones
          </p>
        </div>

        {/* Body */}
        <div className="px-9 py-8">
          <p className="text-sm text-seidor-800/60 text-center mb-6">
            Inicia sesión con tu cuenta corporativa de Microsoft para acceder al
            portal de vacaciones.
          </p>

          <Button
            color="primary"
            size="lg"
            className="w-full btn-primary text-base py-3"
            isLoading={isLoading}
            startContent={!isLoading && (
              <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
                <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
              </svg>
            )}
            onPress={login}
          >
            Iniciar Sesión con Microsoft
          </Button>

          <p className="text-xs text-muted text-center mt-5 leading-relaxed">
            Al iniciar sesión, aceptas el uso de tu cuenta corporativa para
            gestionar solicitudes de vacaciones.
          </p>
        </div>
      </div>
    </div>
  );
}