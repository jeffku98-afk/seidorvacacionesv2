// ============================================
// API: Aprobar Solicitud desde Correo
// ============================================
// GET /api/requests/[id]/approve?token=xxx
//
// Esta ruta permite aprobar solicitudes directamente
// desde un enlace en el correo electrónico.
// Usa un token firmado para validar la acción.
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createServerGraphClient, getServerSiteId } from "@/lib/graph-server";
import { updateListItem, getListItems } from "@/lib/graph-client";
import { sendTeamsNotification, sendEmail } from "@/lib/graph-client";
import { verifyActionToken } from "@/lib/action-tokens";

const LIST_REQUESTS =
  process.env.NEXT_PUBLIC_SP_LIST_SOLICITUDES || "SolicitudesVacaciones";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    // 1. Validar token
    if (!token) {
      return redirectWithMessage("error", "Token de autorización requerido");
    }

    const payload = verifyActionToken(token);
    if (!payload || payload.action !== "approve" || payload.requestId !== itemId) {
      return redirectWithMessage("error", "Token inválido o expirado");
    }

    // 2. Conectar a Graph y SharePoint
    const client = await createServerGraphClient();
    const siteId = await getServerSiteId();

    // 3. Obtener solicitud actual
    const items = await getListItems(client, siteId, LIST_REQUESTS);
    const requestItem = items.find((item: any) => item.id === itemId);

    if (!requestItem) {
      return redirectWithMessage("error", "Solicitud no encontrada");
    }

    if ((requestItem as any).Status !== "Pending") {
      return redirectWithMessage(
        "info",
        "Esta solicitud ya fue procesada anteriormente"
      );
    }

    // 4. Actualizar estado en SharePoint
    await updateListItem(client, siteId, LIST_REQUESTS, itemId, {
      Status: "Approved",
      ApproverComments: "Aprobada desde correo electrónico",
      UpdatedAt: new Date().toISOString(),
    });

    // 5. Notificar al solicitante por correo
    const req = requestItem as any;
    try {
      await sendEmail(client, {
        to: [req.UserEmail],
        subject: `✅ Vacaciones Aprobadas - ${req.StartDate} al ${req.EndDate}`,
        bodyHtml: buildApprovalEmail(req),
      });
    } catch (e) {
      console.error("Error enviando notificación:", e);
    }

    // 6. Notificar al solicitante por Teams
    try {
      await sendTeamsNotification(
        client,
        req.UserId,
        `<h3>✅ Vacaciones Aprobadas</h3><p>Tu solicitud del <strong>${req.StartDate}</strong> al <strong>${req.EndDate}</strong> fue aprobada por ${req.ApproverName}.</p>`
      );
    } catch (e) {
      console.error("Error enviando Teams:", e);
    }

    return redirectWithMessage("success", "Solicitud aprobada correctamente");
  } catch (error) {
    console.error("Error en aprobación:", error);
    return redirectWithMessage("error", "Error al procesar la solicitud");
  }
}

function redirectWithMessage(type: string, message: string) {
  const url = new URL("/action-result", APP_URL);
  url.searchParams.set("type", type);
  url.searchParams.set("message", message);
  return NextResponse.redirect(url);
}

function buildApprovalEmail(req: any): string {
  return `
    <div style="font-family:'Segoe UI',sans-serif;max-width:500px;margin:0 auto;padding:20px;">
      <div style="background:#16A34A;color:#fff;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
        <h2 style="margin:0;">✅ Solicitud Aprobada</h2>
      </div>
      <div style="background:#fff;padding:24px;border:1px solid #E2E8F4;border-radius:0 0 12px 12px;">
        <p>Hola <strong>${req.UserName}</strong>,</p>
        <p>Tu solicitud de vacaciones ha sido <strong style="color:#16A34A;">aprobada</strong>.</p>
        <table style="width:100%;margin:16px 0;border-collapse:collapse;">
          <tr><td style="padding:8px;color:#888;font-size:13px;">Fechas</td><td style="padding:8px;font-weight:600;">${req.StartDate} — ${req.EndDate}</td></tr>
          <tr><td style="padding:8px;color:#888;font-size:13px;">Total días</td><td style="padding:8px;font-weight:600;">${req.TotalDays} días</td></tr>
          <tr><td style="padding:8px;color:#888;font-size:13px;">Aprobado por</td><td style="padding:8px;font-weight:600;">${req.ApproverName}</td></tr>
        </table>
        <p style="color:#666;font-size:14px;">¡Disfruta tus vacaciones! 🎉</p>
      </div>
    </div>`;
}
