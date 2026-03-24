// ============================================
// Providers - Wrapper Client-Side
// ============================================

"use client";

import { HeroUIProvider } from "@heroui/react";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <HeroUIProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: "var(--font-body)",
              },
            }}
            richColors
            closeButton
          />
        </HeroUIProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
