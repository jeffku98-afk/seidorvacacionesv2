// ============================================
// Servicio de Notificaciones (Email + Teams)
// ============================================
// Templates HTML compatibles con Outlook, Gmail, etc.
// Usa tablas y colores sólidos (no gradients ni CSS moderno)
// ============================================

import { Client } from "@microsoft/microsoft-graph-client";
import { sendEmail, sendTeamsNotification } from "./graph-client";
import type { VacationRequest } from "@/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ─── HELPERS ────────────────────────────────────

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";

  try {
    let d: Date;

    if (dateStr.includes("T")) {
      d = new Date(dateStr);
    } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m, day] = dateStr.split("-").map(Number);
      d = new Date(y, m - 1, day);
    } else {
      d = new Date(dateStr);
    }

    if (isNaN(d.getTime())) return dateStr;

    const day = d.getDate();
    const month = MESES[d.getMonth()];
    const year = d.getFullYear();
    return `${day} de ${month} de ${year}`;
  } catch {
    return dateStr;
  }
}

// ─── EMAIL TEMPLATE ─────────────────────────────

function baseEmailTemplate(
  title: string,
  subtitle: string,
  headerColor: string,
  content: string
): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#EEF2F7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;-webkit-font-smoothing:antialiased;">
  <!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:24px auto;">
    <!-- HEADER -->
    <tr>
      <td style="background-color:${headerColor};padding:32px 36px 24px;border-radius:12px 12px 0 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom:16px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <div style="width:36px;height:36px;background-color:rgba(255,255,255,0.2);border-radius:8px;text-align:center;line-height:36px;font-size:20px;">🌴</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">SEIDOR</span>
                    <span style="color:rgba(255,255,255,0.6);font-size:11px;margin-left:6px;letter-spacing:1.5px;text-transform:uppercase;">Vacaciones</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;line-height:1.3;">${title}</h1>
              ${subtitle ? `<p style="color:rgba(255,255,255,0.75);font-size:14px;margin:6px 0 0;line-height:1.4;">${subtitle}</p>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td style="background-color:#ffffff;padding:32px 36px;border-left:1px solid #E2E8F4;border-right:1px solid #E2E8F4;">
        ${content}
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="background-color:#F8FAFC;padding:24px 36px;border:1px solid #E2E8F4;border-top:none;border-radius:0 0 12px 12px;text-align:center;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding-bottom:16px;">
              <a href="${APP_URL}" style="display:inline-block;background-color:#3447B0;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
                Abrir Portal de Vacaciones
              </a>
            </td>
          </tr>
          <tr>
            <td align="center">
              <p style="color:#8490B4;font-size:11px;margin:0;line-height:1.6;">
                Este es un correo automático del Portal de Vacaciones SEIDOR.<br>
                No responder a este mensaje.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <!--[if mso]></td></tr></table><![endif]-->
</body>
</html>`;
}

function requestDetailsTable(req: VacationRequest): string {
  const row = (label: string, value: string, isLast = false) =>
    `<tr>
      <td style="padding:10px 14px;font-size:13px;color:#6B7A99;font-weight:600;${isLast ? "" : "border-bottom:1px solid #EEF2F7;"}width:170px;vertical-align:top;">${label}</td>
      <td style="padding:10px 14px;font-size:14px;color:#1A2240;${isLast ? "" : "border-bottom:1px solid #EEF2F7;"}vertical-align:top;">${value}</td>
    </tr>`;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F7FB;border-radius:8px;margin:20px 0;border:1px solid #E2E8F4;">
      ${row("Solicitante", `<strong>${req.userName}</strong>`)}
      ${row("Fecha Inicio", formatDate(req.startDate))}
      ${row("Fecha Fin", formatDate(req.endDate))}
      ${row("Total Días", `<strong style="color:#3447B0;font-size:16px;">${req.totalDays}</strong> días calendario`)}
      ${row("Motivo", req.reason)}
      ${row("Encargado Pendientes", req.backupUserName)}
      ${row("Tareas Pendientes", req.pendingTasks || "—", true)}
    </table>`;
}

// ─── NOTIFICACIÓN: NUEVA SOLICITUD ──────────────

export async function notifyNewRequest(
  client: Client,
  request: VacationRequest
): Promise<void> {
  const portalUrl = `${APP_URL}/aprobaciones`;

  const content = `
    <p style="color:#1A2240;font-size:15px;line-height:1.6;margin:0 0 4px;">
      Hola <strong>${request.approverName.split(" ")[0]}</strong>,
    </p>
    <p style="color:#5A6484;font-size:14px;line-height:1.6;margin:0 0 8px;">
      <strong>${request.userName}</strong> ha enviado una solicitud de vacaciones que requiere tu aprobación.
    </p>
    ${requestDetailsTable(request)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
      <tr>
        <td align="center">
          <a href="${portalUrl}" style="display:inline-block;background-color:#3447B0;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
            📋&nbsp;&nbsp;Revisar y Aprobar
          </a>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-top:12px;">
          <p style="color:#8490B4;font-size:12px;margin:0;">
            Ingresa al Portal de Vacaciones para aprobar o rechazar esta solicitud.
          </p>
        </td>
      </tr>
    </table>`;

  await sendEmail(client, {
    to: [request.approverEmail],
    cc: [request.backupUserEmail],
    subject: `🏖️ Solicitud de Vacaciones — ${request.userName} (${formatDate(request.startDate)} al ${formatDate(request.endDate)})`,
    bodyHtml: baseEmailTemplate(
      "Nueva Solicitud de Vacaciones",
      `${request.userName} solicita vacaciones del ${formatDate(request.startDate)} al ${formatDate(request.endDate)}`,
      "#3447B0",
      content
    ),
  });

  try {
    const teamsMsg = `
      <h3>🏖️ Nueva Solicitud de Vacaciones</h3>
      <p><strong>${request.userName}</strong> ha solicitado vacaciones del 
      <strong>${formatDate(request.startDate)}</strong> al <strong>${formatDate(request.endDate)}</strong> 
      (${request.totalDays} días).</p>
      <p><strong>Motivo:</strong> ${request.reason}</p>
      <p><a href="${APP_URL}/aprobaciones">👉 Revisar en el Portal</a></p>`;
    await sendTeamsNotification(client, request.approverId, teamsMsg);
  } catch (e) {
    console.warn("Error enviando Teams:", e);
  }
}

// ─── NOTIFICACIÓN: SOLICITUD APROBADA ───────────

export async function notifyRequestApproved(
  client: Client,
  request: VacationRequest
): Promise<void> {
  const content = `
    <p style="color:#1A2240;font-size:15px;line-height:1.6;margin:0 0 4px;">
      Hola <strong>${request.userName.split(" ")[0]}</strong>,
    </p>
    <p style="color:#5A6484;font-size:14px;line-height:1.6;margin:0 0 8px;">
      ¡Buenas noticias! Tu solicitud de vacaciones ha sido aprobada por <strong>${request.approverName}</strong>.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px 0 20px;">
      <tr>
        <td style="background-color:#DCFCE7;border-left:4px solid #16A34A;padding:14px 18px;border-radius:0 8px 8px 0;">
          <span style="color:#166534;font-size:15px;font-weight:700;">✅ APROBADA</span>
        </td>
      </tr>
    </table>
    ${requestDetailsTable(request)}
    ${request.approverComments ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="background-color:#F0FAF0;border-left:3px solid #22C55E;padding:12px 16px;border-radius:0 8px 8px 0;">
          <span style="color:#6B7A99;font-size:12px;font-weight:600;">COMENTARIOS DEL APROBADOR</span><br>
          <span style="color:#1A2240;font-size:14px;line-height:1.5;">${request.approverComments}</span>
        </td>
      </tr>
    </table>` : ""}
    <p style="color:#5A6484;font-size:14px;line-height:1.6;margin:16px 0 0;">
      ¡Disfruta tus vacaciones! 🎉
    </p>`;

  await sendEmail(client, {
    to: [request.userEmail],
    subject: `✅ Vacaciones Aprobadas — ${formatDate(request.startDate)} al ${formatDate(request.endDate)}`,
    bodyHtml: baseEmailTemplate(
      "Solicitud Aprobada",
      `Tus vacaciones del ${formatDate(request.startDate)} al ${formatDate(request.endDate)} fueron aprobadas`,
      "#16A34A",
      content
    ),
  });

  try {
    const teamsMsg = `
      <h3>✅ Vacaciones Aprobadas</h3>
      <p>Tu solicitud de vacaciones del <strong>${formatDate(request.startDate)}</strong> al <strong>${formatDate(request.endDate)}</strong> ha sido <strong>aprobada</strong> por ${request.approverName}.</p>
      <p>¡Disfruta tus vacaciones! 🎉</p>`;
    await sendTeamsNotification(client, request.userId, teamsMsg);
  } catch (e) {
    console.warn("Error enviando Teams:", e);
  }
}

// ─── NOTIFICACIÓN: SOLICITUD RECHAZADA ──────────

export async function notifyRequestRejected(
  client: Client,
  request: VacationRequest
): Promise<void> {
  const content = `
    <p style="color:#1A2240;font-size:15px;line-height:1.6;margin:0 0 4px;">
      Hola <strong>${request.userName.split(" ")[0]}</strong>,
    </p>
    <p style="color:#5A6484;font-size:14px;line-height:1.6;margin:0 0 8px;">
      Lamentablemente tu solicitud de vacaciones ha sido rechazada por <strong>${request.approverName}</strong>.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px 0 20px;">
      <tr>
        <td style="background-color:#FEE2E2;border-left:4px solid #DC2626;padding:14px 18px;border-radius:0 8px 8px 0;">
          <span style="color:#991B1B;font-size:15px;font-weight:700;">❌ RECHAZADA</span>
        </td>
      </tr>
    </table>
    ${requestDetailsTable(request)}
    ${request.approverComments ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="background-color:#FEF2F2;border-left:3px solid #EF4444;padding:12px 16px;border-radius:0 8px 8px 0;">
          <span style="color:#6B7A99;font-size:12px;font-weight:600;">MOTIVO DEL RECHAZO</span><br>
          <span style="color:#1A2240;font-size:14px;line-height:1.5;">${request.approverComments}</span>
        </td>
      </tr>
    </table>` : ""}
    <p style="color:#5A6484;font-size:14px;line-height:1.6;margin:16px 0 0;">
      Puedes comunicarte con tu aprobador para más detalles o enviar una nueva solicitud.
    </p>`;

  await sendEmail(client, {
    to: [request.userEmail],
    subject: `❌ Vacaciones Rechazadas — ${formatDate(request.startDate)} al ${formatDate(request.endDate)}`,
    bodyHtml: baseEmailTemplate(
      "Solicitud Rechazada",
      `Tu solicitud del ${formatDate(request.startDate)} al ${formatDate(request.endDate)} fue rechazada`,
      "#DC2626",
      content
    ),
  });

  try {
    const teamsMsg = `
      <h3>❌ Solicitud de Vacaciones Rechazada</h3>
      <p>Tu solicitud de vacaciones del <strong>${formatDate(request.startDate)}</strong> al <strong>${formatDate(request.endDate)}</strong> fue <strong>rechazada</strong> por ${request.approverName}.</p>
      ${request.approverComments ? `<p><strong>Motivo:</strong> ${request.approverComments}</p>` : ""}
      <p><a href="${APP_URL}/solicitar">Crear nueva solicitud</a></p>`;
    await sendTeamsNotification(client, request.userId, teamsMsg);
  } catch (e) {
    console.warn("Error enviando Teams:", e);
  }
}