// ============================================
// Layout Principal - Providers y Metadata
// ============================================

import type { Metadata } from "next";
import { Providers } from "@/providers/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEIDOR Vacaciones - Portal de Gestión de Vacaciones",
  description:
    "Sistema de solicitud y aprobación de vacaciones para la organización SEIDOR",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
