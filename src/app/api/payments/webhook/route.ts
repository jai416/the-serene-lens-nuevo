import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, error, serverError } from "@/lib/api-response"
import { getQvaPayPaymentStatus } from "@/lib/payments"
import { getPack, CUP_RATE } from "@/lib/pricing"

const PACK_ANALYSES: Record<string, number> = {
  BASIC: 3,
  POPULAR: 5,
  ADVANCED: 15,
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { payment_id, status } = body

    if (!payment_id) {
      return error("payment_id requerido")
    }

    const payment = await db.payment.findUnique({
      where: { qvapayId: payment_id },
      include: { user: true },
    })

    if (!payment) {
      return error("Pago no encontrado")
    }

    if (payment.status === "completed") {
      return ok({ received: true })
    }

    const qvapayStatus = await getQvaPayPaymentStatus(payment_id)
    const remoteStatus = qvapayStatus?.data?.status || status

    if (remoteStatus === "paid" || remoteStatus === "completed") {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: "completed",
          confirmedAt: new Date(),
        },
      })

      const isPack = ["BASIC", "POPULAR", "ADVANCED"].includes(payment.plan)
      const amountUsd = payment.amount

      if (isPack) {
        const analyses = PACK_ANALYSES[payment.plan] || 0
        await db.purchasePack.create({
          data: {
            userId: payment.userId,
            packType: payment.plan,
            provider: "qvapay",
            amountUsd,
            amountCup: amountUsd * CUP_RATE,
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
            qvapayInvoiceId: payment_id,
            plan: payment.plan,
            status: "active",
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
          },
        })
      }
    }

    return ok({ received: true })
  } catch (e) {
    return serverError(e)
  }
}
