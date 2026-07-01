import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, forbidden, serverError } from "@/lib/api-response"
import { getQvaPayPaymentStatus } from "@/lib/payments"
import { logger } from "@/lib/logger"
import { validateCsrf } from "@/lib/csrf-middleware"

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)

    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return error("Cuerpo inválido")
    }

    const { qvapayId } = body as { qvapayId?: string }
    if (!qvapayId || typeof qvapayId !== "string") {
      return error("qvapayId requerido")
    }

    const purchase = await db.digitalProductPurchase.findFirst({
      where: { qvapayId },
      include: { digitalProduct: true },
    })

    if (!purchase) {
      return error("Compra no encontrada", 404)
    }

    if (purchase.userId !== session.user.id && session.user.role !== "ADMIN") {
      return forbidden("No autorizado")
    }

    if (purchase.status === "completed") {
      return ok({ alreadyCompleted: true, downloadUrl: purchase.downloadUrl })
    }

    let qvapayStatus: any = null
    try {
      qvapayStatus = await getQvaPayPaymentStatus(qvapayId)
    } catch (e) {
      logger.error("QvaPay guide status check failed", { error: e instanceof Error ? e.message : "Unknown", qvapayId })
      return error("No se pudo verificar el estado del pago")
    }

    const remoteStatus = qvapayStatus?.status || qvapayStatus?.data?.status
    logger.info("Guide purchase verify result", { qvapayId, remoteStatus, purchaseStatus: purchase.status })

    if (remoteStatus !== "paid" && remoteStatus !== "completed") {
      return ok({ completed: false, status: remoteStatus || "unknown" })
    }

    const downloadUrl = purchase.digitalProduct?.fileUrl || ""

    await db.digitalProductPurchase.update({
      where: { id: purchase.id },
      data: {
        status: "completed",
        downloadUrl,
      },
    })

    logger.info("Guide purchase completed", { guideId: purchase.digitalProductId, userId: session.user.id })

    return ok({ completed: true, downloadUrl })
  } catch (e) {
    logger.error("Guide verify error", { error: e instanceof Error ? e.message : "Unknown" })
    return serverError(e)
  }
}
