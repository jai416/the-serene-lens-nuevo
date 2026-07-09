import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, error, serverError } from "@/lib/api-response"
import { handlePrismaError } from "@/lib/prisma-error"
import { getQvaPayPaymentStatus } from "@/lib/payments"
import { getCUPRate } from "@/lib/cup-rate"
import { checkRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

const PACK_ANALYSES: Record<string, number> = {
  BASIC: 3,
  POPULAR: 5,
  ADVANCED: 15,
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const rl = await checkRateLimit(`webhook:${ip}`, 30, 60 * 1000)
    if (!rl.allowed) {
      return error("Demasiadas solicitudes", 429)
    }

    const body = await req.json()
    const transactionUuid = body.transaction_uuid || body.payment_id

    logger.info("Webhook received", { transactionUuid, body })

    if (!transactionUuid || typeof transactionUuid !== "string") {
      return error("transaction_uuid requerido")
    }

    const existingEvent = await db.webhookEvent.findFirst({
      where: { provider: "qvapay", eventType: transactionUuid, processedAt: { not: null } },
    })
    if (existingEvent) {
      logger.info("Webhook already processed, skipping", { transactionUuid })
      return ok({ received: true, duplicate: true })
    }

    const guidePurchase = await db.digitalProductPurchase.findFirst({
      where: { qvapayId: transactionUuid },
      include: { digitalProduct: true },
    })

    if (guidePurchase) {
      if (guidePurchase.status === "completed") {
        return ok({ received: true, type: "guide" })
      }

      let qvapayStatus: any = null
      try {
        qvapayStatus = await getQvaPayPaymentStatus(transactionUuid)
      } catch {
        return error("No se pudo verificar el pago con QvaPay")
      }

      const remoteStatus = qvapayStatus?.status || qvapayStatus?.data?.status

      if (remoteStatus !== "paid" && remoteStatus !== "completed") {
        return ok({ received: true, verified: false, type: "guide" })
      }

      const downloadUrl = guidePurchase.digitalProduct?.fileUrl || ""

      await db.digitalProductPurchase.update({
        where: { id: guidePurchase.id },
        data: {
          status: "completed",
          downloadUrl,
        },
      })

      logger.info("Guide purchase completed via webhook", { guideId: guidePurchase.digitalProductId })

      return ok({ received: true, type: "guide" })
    }

    const payment = await db.payment.findUnique({
      where: { qvapayId: transactionUuid },
      include: { user: true },
    })

    if (!payment) {
      return error("Pago no encontrado")
    }

    if (payment.status === "completed") {
      return ok({ received: true, type: "plan" })
    }

    let qvapayStatus: any = null
    try {
      qvapayStatus = await getQvaPayPaymentStatus(transactionUuid)
    } catch {
      return error("No se pudo verificar el pago con QvaPay")
    }

    const remoteStatus = qvapayStatus?.status || qvapayStatus?.data?.status

    if (remoteStatus !== "paid" && remoteStatus !== "completed") {
      return ok({ received: true, verified: false, type: "plan" })
    }

    const isPack = ["BASIC", "POPULAR", "ADVANCED"].includes(payment.plan)
    const amountUsd = payment.amount
    let cupRate = 500
    try {
      cupRate = await getCUPRate()
    } catch {
      logger.warn("CUP rate failed in webhook, using default")
    }

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
            provider: "qvapay",
            amountUsd,
            amountCup: amountUsd * cupRate,
            analyses,
            status: "completed",
          },
        })
      } else if (payment.plan) {
        await tx.user.update({
          where: { id: payment.userId },
          data: { plan: payment.plan },
        })

        const periodEnd = new Date()
        periodEnd.setDate(periodEnd.getDate() + 30)

        await tx.subscription.create({
          data: {
            userId: payment.userId,
            provider: "qvapay",
            qvapayInvoiceId: transactionUuid,
            plan: payment.plan,
            status: "active",
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
          },
        })
      }
    })

    return ok({ received: true, type: "plan" })
  } catch (e) {
    const prismaRes = handlePrismaError(e)
    if (prismaRes) return prismaRes

    logger.error("Webhook error", { error: e instanceof Error ? e.message : "Unknown" })
    return serverError(e)
  }
}
