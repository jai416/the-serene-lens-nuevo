import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { sendBulkEmail, getRecipients } from "@/lib/services/admin-email.service"
import { logger } from "@/lib/logger"
import { checkRateLimit } from "@/lib/rate-limit"
import { ok, error, unauthorized, serverError } from "@/lib/api-response"

const sendEmailSchema = z.object({
  subject: z.string().min(1).max(200),
  html: z.string().min(1),
  segment: z.enum(["all", "free", "premium", "pro", "proPlus", "active", "inactive", "new"]),
  preview: z.boolean().optional(),
  previewEmail: z.string().email().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return unauthorized()
    }

    const rl = await checkRateLimit(`admin-email:${session.user.id}`, 5, 60 * 60 * 1000)
    if (!rl.allowed) {
      return error("Demasiados envíos. Intenta más tarde.", 429)
    }

    const body = await request.json()
    const parsed = sendEmailSchema.safeParse(body)

    if (!parsed.success) {
      return error("Datos inválidos", 400)
    }

    const { subject, html, segment, preview, previewEmail } = parsed.data

    if (preview) {
      if (!previewEmail) {
        return error("Se requiere email para vista previa", 400)
      }

      const result = await sendBulkEmail({
        subject,
        html,
        segment: "preview",
        recipients: [{ email: previewEmail }],
      })

      return ok({
        preview: true,
        sent: result.sent,
        failed: result.failed,
      })
    }

    const recipients = await getRecipients(segment)

    if (recipients.length === 0) {
      return error("No hay destinatarios para este segmento", 400)
    }

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

    return ok({
      sent: result.sent,
      failed: result.failed,
      errors: result.errors,
      segment,
    })
  } catch {
    return serverError()
  }
}
