import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, serverError } from "@/lib/api-response"
import { verifyPayPalOrder } from "@/lib/paypal"
import { validateCsrf } from "@/lib/csrf-middleware"
import { logger } from "@/lib/logger"

import { PACK_ANALYSES } from "@/lib/pricing"

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

    const bodyData = body as { paypalOrderId?: string }
    const { paypalOrderId } = bodyData

    if (!paypalOrderId || typeof paypalOrderId !== "string") {
      return error("paypalOrderId requerido")
    }

    const payment = await db.payment.findUnique({
      where: { paypalOrderId: paypalOrderId },
      include: { user: true },
    })

    if (!payment) {
      return error("Pago no encontrado", 404)
    }

    if (payment.userId !== session.user.id && session.user.role !== "ADMIN") {
      return error("No autorizado", 403)
    }

    if (payment.status === "completed") {
      return ok({ alreadyCompleted: true })
    }

    let paypalStatus: { status: string; amount: number }
    try {
      paypalStatus = await verifyPayPalOrder(paypalOrderId)
    } catch (e) {
      logger.error("PayPal status check failed", { error: e instanceof Error ? e.message : "Unknown", paypalOrderId })
      return error("No se pudo verificar el estado del pago")
    }

    logger.info("Payment verify result", { paypalOrderId, paypalStatus: paypalStatus.status, paymentStatus: payment.status })

    if (paypalStatus.status !== "COMPLETED" && paypalStatus.status !== "APPROVED") {
      return ok({ completed: false, status: paypalStatus.status || "unknown" })
    }

    const isPack = ["BASIC", "POPULAR", "ADVANCED"].includes(payment.plan)
    const amountUsd = payment.amount
    const cupRate = Number(process.env.NEXT_PUBLIC_CUP_FALLBACK) || 500

    await db.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "completed",
          confirmedAt: new Date(),
        },
      })

      if (isPack) {
        const analyses = PACK_ANALYSES[payment.plan] || 0
        await tx.purchasePack.create({
          data: {
            userId: payment.userId,
            packType: payment.plan,
            provider: "paypal",
            amountUsd,
            amountCup: amountUsd * cupRate,
            analyses,
            status: "completed",
          },
        })
      } else if (payment.plan) {
        const isAnnual = payment.plan.endsWith("_ANNUAL")
        const periodEnd = new Date()
        periodEnd.setDate(periodEnd.getDate() + (isAnnual ? 365 : 30))

        await tx.user.update({
          where: { id: payment.userId },
          data: { plan: payment.plan },
        })

        await tx.subscription.create({
          data: {
            userId: payment.userId,
            provider: "paypal",
            paypalSubscriptionId: paypalOrderId,
            plan: payment.plan,
            status: "active",
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
          },
        })
      }
    })

    return ok({ completed: true })
  } catch (e) {
    logger.error("Payment verify error", { error: e instanceof Error ? e.message : "Unknown" })
    return serverError(e)
  }
}
