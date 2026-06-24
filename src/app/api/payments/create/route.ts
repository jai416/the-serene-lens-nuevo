import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, serverError, unauthorized } from "@/lib/api-response"
import { createQvaPayPayment, getPaymentError } from "@/lib/payments"
import { getPlan } from "@/lib/pricing"
import { getCUPRate } from "@/lib/cup-rate"
import { z } from "zod"
import { logger } from "@/lib/logger"

const createPaymentSchema = z.object({
  plan: z.string().min(1).max(50),
}).strict()

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const body = await req.json()
    const parsed = createPaymentSchema.safeParse(body)
    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "), 400)
    }

    const planDef = getPlan(parsed.data.plan)
    if (!planDef || planDef.priceUSD === 0) {
      return error("Plan inválido")
    }

    try {
      const amount = planDef.priceUSD
      const cupRate = await getCUPRate()
      const qvapayPayment = await createQvaPayPayment({
        amount,
        description: `Plan ${planDef.name} - The Serene Lens`,
        plan: parsed.data.plan,
        userId: session.user.id,
      })

      const transactionUuid = qvapayPayment?.transaction_uuid
      if (transactionUuid) {
        await db.payment.create({
          data: {
            userId: session.user.id,
            provider: "qvapay",
            qvapayId: transactionUuid,
            plan: parsed.data.plan,
            amount,
            amountUsd: amount,
            amountCup: amount * cupRate,
            remoteId: qvapayPayment.remote_id,
          },
        })
      }

      return ok({ url: qvapayPayment?.url, id: transactionUuid, provider: "qvapay" })
    } catch (e) {
      logger.error("QvaPay create error", { error: e instanceof Error ? e.message : "Unknown" })
      return error(getPaymentError("qvapay", e))
    }
  } catch (e) {
    return serverError(e)
  }
}
