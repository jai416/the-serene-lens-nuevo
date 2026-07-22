import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized } from "@/lib/api-response"
import { createPayPalOrder } from "@/lib/paypal"
import { getPack } from "@/lib/pricing"
import { getCUPRate } from "@/lib/cup-rate"
import { z } from "zod"
import { logger } from "@/lib/logger"
import { validateCsrf } from "@/lib/csrf-middleware"

const packSchema = z.object({
  packType: z.enum(["BASIC", "POPULAR", "ADVANCED"]),
})

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

    const parsed = packSchema.safeParse(body)
    if (!parsed.success) {
      logger.warn("Pack create validation failed", { issues: parsed.error.issues, body })
      return error(parsed.error.issues.map((i) => i.message).join(", "), 400)
    }

    const { packType } = parsed.data
    const packDef = getPack(packType)
    if (!packDef) {
      return error("Pack no encontrado")
    }

    const amount = packDef.priceUSD
    let cupRate = 500
    try {
      cupRate = await getCUPRate()
    } catch {
      logger.warn("CUP rate fetch failed, using default 500")
    }

    logger.info("Creating PayPal pack payment", { packType, amount, userId: session.user.id })

    const existingIntent = await db.payment.findFirst({
      where: {
        userId: session.user.id,
        plan: packType,
        status: { in: ["pending_creation", "pending"] },
      },
    })
    if (existingIntent) {
      logger.info("Found existing pending pack payment", { paymentId: existingIntent.id, status: existingIntent.status })
      if (existingIntent.status === "pending_creation") {
        return error("Ya hay un pago en proceso para este pack. Espera unos segundos y vuelve a intentar.", 409)
      }
      return ok({ url: null, id: existingIntent.paypalOrderId, provider: "paypal", existing: true, paymentId: existingIntent.id })
    }

    const payment = await db.payment.create({
      data: {
        userId: session.user.id,
        provider: "paypal",
        plan: packType,
        status: "pending_creation",
        amount,
        amountUsd: amount,
        amountCup: amount * cupRate,
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"
    let paypalOrder: { id: string; approvalUrl: string }
    try {
      paypalOrder = await createPayPalOrder({
        amount,
        description: `Pack ${packDef.name} - The Serene Lens`,
        returnUrl: appUrl + "/pricing/success?provider=paypal&token=",
        cancelUrl: appUrl + "/pricing?cancelled=true",
      })
    } catch (e) {
      await db.payment.update({
        where: { id: payment.id },
        data: { status: "failed" },
      })
      throw e
    }

    logger.info("PayPal pack order created", {
      orderId: paypalOrder.id,
      hasApprovalUrl: !!paypalOrder.approvalUrl,
    })

    if (paypalOrder.id) {
      try {
        await db.payment.update({
          where: { id: payment.id },
          data: {
            paypalOrderId: paypalOrder.id,
            status: "pending",
          },
        })
      } catch (e) {
        logger.error("DB payment update error", { error: e instanceof Error ? e.message : "Unknown" })
      }
    }

    if (!paypalOrder.approvalUrl) {
      logger.error("PayPal returned no approval URL", { paypalOrder })
      await db.payment.update({
        where: { id: payment.id },
        data: { status: "failed" },
      })
      return error("Error al generar enlace de pago")
    }

    return ok({ url: paypalOrder.approvalUrl, id: paypalOrder.id, provider: "paypal" })
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e)
    logger.error("Pack payment error", { error: errMsg })

    if (errMsg.includes("PayPal credentials")) {
      return error("Sistema de pagos no configurado. Contacta al soporte.", 503)
    }
    if (errMsg.includes("fetch failed") || errMsg.includes("ETIMEDOUT")) {
      return error("El servicio de pagos no está disponible. Intenta de nuevo.", 503)
    }

    return error("Error al procesar el pago. Intenta de nuevo.", 500)
  }
}
