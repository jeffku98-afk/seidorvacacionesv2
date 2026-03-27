import { NextRequest, NextResponse } from "next/server";
import { createServerGraphClient, getServerSiteId } from "@/lib/graph-server";
import { getListItems } from "@/lib/graph-client";

const LIST_REQUESTS =
  process.env.NEXT_PUBLIC_SP_LIST_SOLICITUDES || "SolicitudesVacaciones";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ─── DATE HELPER ────────────────────────────────

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
    return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

// ─── EMAIL TEMPLATE ─────────────────────────────

function buildReminderEmail(
  approverName: string,
  pendingRequests: any[]
): string {
  const rows = pendingRequests
    .map(
      (r) => `
    <tr>
      <td style="padding:10px 14px;font-size:14px;color:#1A2240;border-bottom:1px solid #EEF2F7;">
        <strong>${r.UserName}</strong>
      </td>
      <td style="padding:10px 14px;font-size:13px;color:#5A6484;border-bottom:1px solid #EEF2F7;">
        ${formatDate(r.StartDate)} — ${formatDate(r.EndDate)}
      </td>
      <td style="padding:10px 14px;font-size:13px;color:#3447B0;font-weight:600;border-bottom:1px solid #EEF2F7;text-align:center;">
        ${r.TotalDays} días
      </td>
      <td style="padding:10px 14px;font-size:13px;color:#5A6484;border-bottom:1px solid #EEF2F7;">
        ${r.Reason || "—"}
      </td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aprobaciones Pendientes</title>
</head>
<body style="margin:0;padding:0;background-color:#EEF2F7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <!--[if mso]><table role="presentation" width="650" align="center" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:650px;margin:24px auto;">
    <!-- HEADER -->
    <tr>
      <td style="background-color:#3447B0;padding:32px 36px 24px;border-radius:12px 12px 0 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom:16px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <div style="width:36px;height:36px;background-color:rgba(255,255,255,0.2);border-radius:8px;text-align:center;line-height:36px;font-size:20px;">🌴</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="color:#ffffff;font-size:20px;font-weight:700;">SEIDOR</span>
                    <span style="color:rgba(255,255,255,0.6);font-size:11px;margin-left:6px;letter-spacing:1.5px;text-transform:uppercase;">Vacaciones</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">⏳ Aprobaciones Pendientes</h1>
              <p style="color:rgba(255,255,255,0.75);font-size:14px;margin:6px 0 0;">
                Tienes ${pendingRequests.length} solicitud${pendingRequests.length > 1 ? "es" : ""} pendiente${pendingRequests.length > 1 ? "s" : ""} de aprobación
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td style="background-color:#ffffff;padding:32px 36px;border-left:1px solid #E2E8F4;border-right:1px solid #E2E8F4;">
        <p style="color:#1A2240;font-size:15px;margin:0 0 4px;">
          Hola <strong>${approverName.split(" ")[0]}</strong>,
        </p>
        <p style="color:#5A6484;font-size:14px;margin:0 0 20px;">
          Las siguientes solicitudes de vacaciones están pendientes de tu aprobación:
        </p>

        <!-- TABLE -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F4;border-radius:8px;overflow:hidden;">
          <tr style="background-color:#F4F7FB;">
            <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#6B7A99;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #E2E8F4;">Solicitante</td>
            <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#6B7A99;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #E2E8F4;">Fechas</td>
            <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#6B7A99;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #E2E8F4;text-align:center;">Días</td>
            <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#6B7A99;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #E2E8F4;">Motivo</td>
          </tr>
          ${rows}
        </table>

        <!-- CTA -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
          <tr>
            <td align="center">
              <a href="${APP_URL}/aprobaciones" style="display:inline-block;background-color:#3447B0;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
                📋&nbsp;&nbsp;Revisar Solicitudes
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="background-color:#F8FAFC;padding:20px 36px;border:1px solid #E2E8F4;border-top:none;border-radius:0 0 12px 12px;text-align:center;">
        <p style="color:#8490B4;font-size:11px;margin:0;">
          Recordatorio automático del Portal de Vacaciones SEIDOR.<br>
          Se envía de lunes a viernes a las 10:00 a.m. solo si hay solicitudes pendientes.
        </p>
      </td>
    </tr>
  </table>
  <!--[if mso]></td></tr></table><![endif]-->
</body>
</html>`;
}

// ─── HANDLER ────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // 1. Verificar que la petición viene de Vercel Cron
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Conectar a Graph con credenciales de app
    const client = await createServerGraphClient();
    const siteId = await getServerSiteId();

    // 3. Obtener todas las solicitudes pendientes
    const allItems = await getListItems(client, siteId, LIST_REQUESTS);
    const pendingItems = allItems.filter(
      (item: any) => item.Status === "Pending"
    );

    if (pendingItems.length === 0) {
      return NextResponse.json({
        message: "No hay solicitudes pendientes",
        emailsSent: 0,
      });
    }

    // 4. Agrupar por aprobador
    const byApprover: Record<string, { name: string; email: string; requests: any[] }> = {};

    for (const item of pendingItems as any[]) {
      const key = item.ApproverEmail?.toLowerCase();
      if (!key) continue;

      if (!byApprover[key]) {
        byApprover[key] = {
          name: item.ApproverName,
          email: item.ApproverEmail,
          requests: [],
        };
      }
      byApprover[key].requests.push(item);
    }

    // 5. Enviar correo a cada aprobador
    let emailsSent = 0;
    const errors: string[] = [];

    for (const [email, data] of Object.entries(byApprover)) {
      try {
        const htmlBody = buildReminderEmail(data.name, data.requests);

        await client.api("/users/" + data.email + "/sendMail").post({
          message: {
            subject: `⏳ Tienes ${data.requests.length} solicitud${data.requests.length > 1 ? "es" : ""} de vacaciones pendiente${data.requests.length > 1 ? "s" : ""} de aprobación`,
            body: {
              contentType: "HTML",
              content: htmlBody,
            },
            toRecipients: [
              { emailAddress: { address: data.email } },
            ],
          },
          saveToSentItems: false,
        });

        emailsSent++;
        console.log(`✅ Recordatorio enviado a ${data.name} (${email}) — ${data.requests.length} pendientes`);
      } catch (err) {
        const errorMsg = `Error enviando a ${email}: ${err}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return NextResponse.json({
      message: `Recordatorios enviados`,
      totalPending: pendingItems.length,
      approversNotified: emailsSent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error en cron de recordatorios:", error);
    return NextResponse.json(
      { error: "Error procesando recordatorios" },
      { status: 500 }
    );
  }
}