// ============================================
// Middleware - Protección de Rutas
// ============================================
// Redirige usuarios no autenticados a /login
// Las rutas protegidas son todas bajo /(dashboard)
//
// Nota: MSAL maneja la autenticación en el cliente,
// este middleware verifica la existencia de la cuenta
// en las cookies/localStorage de MSAL como capa adicional.
// ============================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = [
  "/solicitudes",
  "/solicitar",
  "/aprobaciones",
  "/calendario",
];

const PUBLIC_PATHS = ["/login", "/api"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if path is protected
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected) {
    // Check for MSAL account data in cookies
    // MSAL stores session data; if no MSAL keys found, redirect to login
    const hasMsalData = request.cookies
      .getAll()
      .some((c) => c.name.includes("msal") || c.name.includes("login.windows"));

    // Also check for a custom session indicator we set after login
    const hasSession = request.cookies.get("seidor-session");

    if (!hasMsalData && !hasSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
