// ============================================
// Página Raíz - Redirección según auth
// ============================================

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function RootPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      router.replace(isAuthenticated ? "/solicitudes" : "/login");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-seidor-500 via-[#2A3890] to-seidor-400">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-gradient-to-br from-seidor-200 to-seidor-400 flex items-center justify-center text-3xl shadow-lg">
          🌴
        </div>
        <LoadingSpinner size="lg" className="border-white/30 border-t-white" />
        <p className="text-white/60 text-sm mt-4">Cargando...</p>
      </div>
    </div>
  );
}
