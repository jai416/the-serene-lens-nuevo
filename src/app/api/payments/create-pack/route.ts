import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, serverError, unauthorized } from "@/lib/api-response"
import { createQvaPayPackPayment, getPaymentError } from "@/lib/payments"
import { getPack } from "@/lib/pricing"
import { getCUPRate } from "@/lib/cup-rate"
import { z } from "zod"
import { logger } from "@/lib/logger"

const packSchema = z.object({
  packType: z.enum(["BASIC", "POPULAR", "ADVANCED"]),
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

    const parsed = packSchema.safeParse(body)
    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "), 400)
    }

    const { packType } = parsed.data
    const packDef = getPack(packType)
    if (!packDef) {
      return error("Pack no encontrado")
    }

    try {
      const amount = packDef.priceUSD
      const cupRate = await getCUPRate()

      let qvapayPayment: any
      try {
        qvapayPayment = await createQvaPayPackPayment({
          amount,
          description: `Pack ${packDef.name} - The Serene Lens`,
          plan: "",
          userId: session.user.id,
          packType,
        })
      } catch (e) {
        logger.error("QvaPay pack API error", { error: e instanceof Error ? e.message : "Unknown" })
        return error("No se pudo conectar con el procesador de pagos. Intenta de nuevo.")
      }

      const transactionUuid = qvapayPayment?.transaction_uuid
      if (transactionUuid) {
        try {
          await db.payment.create({
            data: {
              userId: session.user.id,
              provider: "qvapay",
              qvapayId: transactionUuid,
              plan: packType,
              amount,
              amountUsd: amount,
              amountCup: amount * cupRate,
              remoteId: qvapayPayment.remote_id,
            },
          })
        } catch (e) {
          logger.error("DB payment save error", { error: e instanceof Error ? e.message : "Unknown" })
        }
      }

      if (!qvapayPayment?.url) {
        logger.error("QvaPay returned no URL", { qvapayPayment })
        return error("Error al generar enlace de pago")
      }

      return ok({ url: qvapayPayment.url, id: transactionUuid, provider: "qvapay" })
    } catch (e) {
      logger.error("QvaPay pack flow error", { error: e instanceof Error ? e.message : "Unknown" })
      return error(getPaymentError("qvapay", e))
    }
  } catch (e) {
    logger.error("Unexpected pack error", { error: e instanceof Error ? e.message : "Unknown" })
    return serverError(e)
  }
}
