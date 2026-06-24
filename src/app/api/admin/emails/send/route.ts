import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { sendBulkEmail, getRecipients } from "@/lib/services/admin-email.service"
import { logger } from "@/lib/logger"
import { checkRateLimit } from "@/lib/rate-limit"

const sendEmailSchema = z.object({
  subject: z.string().min(1).max(200),
  html: z.string().min(1),
  segment: z.enum(["all", "free", "premium", "pro", "active", "inactive", "new"]),
  preview: z.boolean().optional(),
  previewEmail: z.string().email().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const rl = await checkRateLimit(`admin-email:${session.user.id}`, 5, 60 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json({ error: "Demasiados envíos. Intenta más tarde." }, { status: 429 })
    }

    const body = await request.json()
    const parsed = sendEmailSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const { subject, html, segment, preview, previewEmail } = parsed.data

    // Preview mode: send only to the admin
    if (preview) {
      if (!previewEmail) {
        return NextResponse.json(
          { error: "Se requiere email para vista previa" },
          { status: 400 }
        )
      }

      const result = await sendBulkEmail({
        subject,
        html,
        segment: "preview",
        recipients: [{ email: previewEmail }],
      })

      return NextResponse.json({
        success: true,
        preview: true,
        sent: result.sent,
        failed: result.failed,
      })
    }

    // Get recipients for the segment
    const recipients = await getRecipients(segment)

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No hay destinatarios para este segmento" },
        { status: 400 }
      )
    }

    // Send bulk email
    const result = await sendBulkEmail({
      subject,
      html,
      segment,
      recipients,
    })

    logger.info("Admin bulk email sent", {
      subject,
      segment,
      recipientCount: recipients.length,
      sent: result.sent,
      failed: result.failed,
      adminId: session.user.id,
    })

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors,
      segment,
    })
  } catch (error) {
    logger.error("Email send error", { error: error instanceof Error ? error.message : "Unknown" })
    return NextResponse.json(
      { error: "Error al enviar emails" },
      { status: 500 }
    )
  }
}
