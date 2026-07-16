import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, serverError } from "@/lib/api-response"
import { getQvaPayPaymentStatus } from "@/lib/payments"
import { validateCsrf } from "@/lib/csrf-middleware"
import { logger } from "@/lib/logger"

const PACK_ANALYSES: Record<string, number> = {
  BASIC: 3,
  POPULAR: 5,
  ADVANCED: 15,
}

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

    const bodyData = body as { qvapayId?: string }
    const { qvapayId } = bodyData

    if (!qvapayId || typeof qvapayId !== "string") {
      return error("qvapayId requerido")
    }

    const payment = await db.payment.findUnique({
      where: { qvapayId },
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

    let qvapayStatus: any = null
    try {
      qvapayStatus = await getQvaPayPaymentStatus(qvapayId)
    } catch (e) {
      logger.error("QvaPay status check failed", { error: e instanceof Error ? e.message : "Unknown", qvapayId })
      return error("No se pudo verificar el estado del pago")
    }

    const remoteStatus = qvapayStatus?.status || qvapayStatus?.data?.status
    logger.info("Payment verify result", { qvapayId, remoteStatus, paymentStatus: payment.status })

    if (remoteStatus !== "paid" && remoteStatus !== "completed") {
      return ok({ completed: false, status: remoteStatus || "unknown" })
    }

    const isPack = ["BASIC", "POPULAR", "ADVANCED"].includes(payment.plan)
    const amountUsd = payment.amount
    const cupRate = 500

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
            provider: "qvapay",
            qvapayInvoiceId: qvapayId,
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
