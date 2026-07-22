import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, forbidden, serverError } from "@/lib/api-response"
import { verifyPayPalOrder } from "@/lib/paypal"
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

    const { paypalOrderId } = body as { paypalOrderId?: string }
    if (!paypalOrderId || typeof paypalOrderId !== "string") {
      return error("paypalOrderId requerido")
    }

    const purchase = await db.digitalProductPurchase.findFirst({
      where: { paypalOrderId: paypalOrderId },
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

    let paypalStatus: { status: string; amount: number }
    try {
      paypalStatus = await verifyPayPalOrder(paypalOrderId)
    } catch (e) {
      logger.error("PayPal guide status check failed", { error: e instanceof Error ? e.message : "Unknown", paypalOrderId })
      return error("No se pudo verificar el estado del pago")
    }

    logger.info("Guide purchase verify result", { paypalOrderId, paypalStatus: paypalStatus.status, purchaseStatus: purchase.status })

    if (paypalStatus.status !== "COMPLETED" && paypalStatus.status !== "APPROVED") {
      return ok({ completed: false, status: paypalStatus.status || "unknown" })
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
