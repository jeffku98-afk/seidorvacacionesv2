// ============================================
// Tokens de Acción para Aprobación por Correo
// ============================================
// Genera y verifica tokens firmados que se incluyen
// en los enlaces de "Aprobar" / "Rechazar" del correo.
//
// Usa HMAC-SHA256 con el CLIENT_SECRET como key.
// Los tokens expiran en 7 días.
// ============================================

import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.AZURE_CLIENT_SECRET || "fallback-secret-for-dev";
const TOKEN_EXPIRY_DAYS = 7;

interface ActionTokenPayload {
  requestId: string;
  action: "approve" | "reject";
  approverEmail: string;
  exp: number; // Unix timestamp
}

/**
 * Genera un token firmado para una acción de aprobación/rechazo
 */
export function generateActionToken(
  requestId: string,
  action: "approve" | "reject",
  approverEmail: string
): string {
  const payload: ActionTokenPayload = {
    requestId,
    action,
    approverEmail,
    exp: Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  };

  const data = JSON.stringify(payload);
  const encoded = Buffer.from(data).toString("base64url");
  const signature = createHmac("sha256", SECRET)
    .update(encoded)
    .digest("base64url");

  return `${encoded}.${signature}`;
}

/**
 * Verifica y decodifica un token de acción
 * Retorna null si el token es inválido o expirado
 */
export function verifyActionToken(token: string): ActionTokenPayload | null {
  try {
    const [encoded, signature] = token.split(".");

    if (!encoded || !signature) return null;

    // Verify signature
    const expectedSig = createHmac("sha256", SECRET)
      .update(encoded)
      .digest("base64url");

    const sigBuffer = Buffer.from(signature, "base64url");
    const expectedBuffer = Buffer.from(expectedSig, "base64url");

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return null;
    }

    // Decode payload
    const data = Buffer.from(encoded, "base64url").toString("utf-8");
    const payload: ActionTokenPayload = JSON.parse(data);

    // Check expiration
    if (Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Genera las URLs de aprobación/rechazo para incluir en correos
 */
export function generateEmailActionUrls(
  requestId: string,
  approverEmail: string
): { approveUrl: string; rejectUrl: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const approveToken = generateActionToken(requestId, "approve", approverEmail);
  const rejectToken = generateActionToken(requestId, "reject", approverEmail);

  return {
    approveUrl: `${appUrl}/api/requests/${requestId}/approve?token=${approveToken}`,
    rejectUrl: `${appUrl}/api/requests/${requestId}/reject?token=${rejectToken}`,
  };
}
