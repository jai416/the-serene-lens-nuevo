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
  plan: z.enum(["FREE", "PREMIUM", "PRO", "PRO_PLUS"]),
  provider: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return error("Cuerpo de solicitud inválido")
    }

    const parsed = createPaymentSchema.safeParse(body)
    if (!parsed.success) {
      logger.warn("Payment create validation failed", { issues: parsed.error.issues, body })
      return error(parsed.error.issues.map((i) => i.message).join(", "), 400)
    }

    const planDef = getPlan(parsed.data.plan)
    if (!planDef || planDef.priceUSD === 0) {
      return error("Plan inválido o gratuito")
    }

    try {
      const amount = planDef.priceUSD
      let cupRate = 500
      try {
        cupRate = await getCUPRate()
      } catch {
        logger.warn("CUP rate fetch failed, using default 500")
      }
      logger.info("Creating QvaPay payment", { plan: parsed.data.plan, amount, userId: session.user.id })
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
      const errMsg = e instanceof Error ? e.message : String(e)
      logger.error("Payment create inner error", { error: errMsg })
      return error(`Error al crear pago: ${errMsg}`, 500)
    }
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e)
    logger.error("Payment create outer error", { error: errMsg })
    return error(`Error interno: ${errMsg}`, 500)
  }
}
