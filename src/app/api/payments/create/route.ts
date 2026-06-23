import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, serverError, unauthorized } from "@/lib/api-response"
import { createQvaPayPayment, getPaymentError } from "@/lib/payments"
import { getPlan } from "@/lib/pricing"
import { getCUPRate } from "@/lib/cup-rate"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const { plan } = await req.json()

    const planDef = getPlan(plan)
    if (!planDef || planDef.priceUSD === 0) {
      return error("Plan inválido")
    }

    try {
      const amount = planDef.priceUSD
      const cupRate = await getCUPRate()
      const qvapayPayment = await createQvaPayPayment({
        amount,
        description: `Plan ${planDef.name} - The Serene Lens`,
        plan,
        userId: session.user.id,
      })

      const transactionUuid = qvapayPayment?.transaction_uuid
      if (transactionUuid) {
        await db.payment.create({
          data: {
            userId: session.user.id,
            provider: "qvapay",
            qvapayId: transactionUuid,
            plan,
            amount,
            amountUsd: amount,
            amountCup: amount * cupRate,
            remoteId: qvapayPayment.remote_id,
          },
        })
      }

      return ok({ url: qvapayPayment?.url, id: transactionUuid, provider: "qvapay" })
    } catch (e) {
      console.error("[payments/create] QvaPay error:", e)
      return error(getPaymentError("qvapay", e))
    }
  } catch (e) {
    return serverError(e)
  }
}
