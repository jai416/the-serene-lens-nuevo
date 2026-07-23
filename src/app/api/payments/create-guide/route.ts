import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, serverError, error } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { validateCsrf } from "@/lib/csrf-middleware"
import { createPayPalOrder, isPaypalConfigured } from "@/lib/paypal"

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)

    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return error("Cuerpo de solicitud inválido")
    }

    const { guideId } = body as { guideId?: string }

    if (!guideId || typeof guideId !== "string") return error("guideId requerido")

    const guide = await db.digitalProduct.findUnique({
      where: { id: guideId, isActive: true },
    })

    if (!guide) return error("Guía no encontrada", 404)

    const existingPurchase = await db.digitalProductPurchase.findFirst({
      where: {
        userId: session.user.id,
        digitalProductId: guideId,
        status: "completed",
      },
    })

    if (existingPurchase) {
      return ok({
        alreadyPurchased: true,
        downloadUrl: existingPurchase.downloadUrl,
        message: "Ya has comprado esta guía.",
      })
    }

    if (!isPaypalConfigured()) {
      return error("Sistema de pagos no configurado. Contacta al soporte.", 503)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""

    let paypalOrder: { id: string; approvalUrl: string }
    try {
      paypalOrder = await createPayPalOrder({
        amount: guide.price,
        description: `Guía: ${guide.title}`,
        returnUrl: `${appUrl}/guides?success=${guideId}`,
        cancelUrl: `${appUrl}/guides`,
      })
    } catch (e) {
      logger.error("PayPal guide order error", { error: e instanceof Error ? e.message : "Unknown" })
      return error("No se pudo conectar con el procesador de pagos")
    }

    logger.info("PayPal guide order created", { orderId: paypalOrder.id })

    try {
      await db.digitalProductPurchase.create({
        data: {
          userId: session.user.id,
          digitalProductId: guideId,
          amount: guide.price,
          provider: "paypal",
          paypalOrderId: paypalOrder.id,
          status: "pending",
        },
      })
    } catch (e) {
      logger.error("DB save guide purchase error", { error: e instanceof Error ? e.message : "Unknown" })
    }

    return ok({
      url: paypalOrder.approvalUrl,
      invoiceId: paypalOrder.id,
    })
  } catch (e) {
    logger.error("create-guide error", { error: e instanceof Error ? e.message : String(e) })
    return serverError(e)
  }
}
