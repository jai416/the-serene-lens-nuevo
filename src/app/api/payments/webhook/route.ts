import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, error, serverError } from "@/lib/api-response"
import { getQvaPayPaymentStatus } from "@/lib/payments"
import { getCUPRate } from "@/lib/cup-rate"
import { checkRateLimit } from "@/lib/rate-limit"

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

    if (!transactionUuid || typeof transactionUuid !== "string") {
      return error("transaction_uuid requerido")
    }

    const payment = await db.payment.findUnique({
      where: { qvapayId: transactionUuid },
      include: { user: true },
    })

    if (!payment) {
      return error("Pago no encontrado")
    }

    if (payment.status === "completed") {
      return ok({ received: true })
    }

    let qvapayStatus: any = null
    try {
      qvapayStatus = await getQvaPayPaymentStatus(transactionUuid)
    } catch {
      return error("No se pudo verificar el pago con QvaPay")
    }

    const remoteStatus = qvapayStatus?.status || qvapayStatus?.data?.status

    if (remoteStatus !== "paid" && remoteStatus !== "completed") {
      return ok({ received: true, verified: false })
    }

    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "completed",
        confirmedAt: new Date(),
      },
    })

    const isPack = ["BASIC", "POPULAR", "ADVANCED"].includes(payment.plan)
    const amountUsd = payment.amount
    const cupRate = await getCUPRate()

    if (isPack) {
      const analyses = PACK_ANALYSES[payment.plan] || 0
      await db.purchasePack.create({
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
      await db.user.update({
        where: { id: payment.userId },
        data: { plan: payment.plan },
      })

      const periodEnd = new Date()
      periodEnd.setDate(periodEnd.getDate() + 30)

      await db.subscription.create({
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

    return ok({ received: true })
  } catch (e) {
    return serverError(e)
  }
}
