import { NextRequest, NextResponse } from "next/server"
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

    logger.info("Creating QvaPay pack payment", { packType, amount, userId: session.user.id })

    const qvapayPayment = await createQvaPayPackPayment({
      amount,
      description: `Pack ${packDef.name} - The Serene Lens`,
      plan: "",
      userId: session.user.id,
      packType,
    })

    const transactionUuid = qvapayPayment?.invoice_id || qvapayPayment?.transaction_uuid
    if (transactionUuid) {
      try {
        await db.payment.create({
          data: {
            userId: session.user.id,
            provider: "qvapay",
            qvapayId: String(transactionUuid),
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
    const errMsg = e instanceof Error ? e.message : String(e)
    logger.error("Pack payment error", { error: errMsg })

    if (errMsg.includes("QvaPay credentials")) {
      return error("Sistema de pagos no configurado. Contacta al soporte.", 503)
    }
    if (errMsg.includes("fetch failed") || errMsg.includes("ETIMEDOUT")) {
      return error("El servicio de pagos no está disponible. Intenta de nuevo.", 503)
    }

    return NextResponse.json(
      { success: false, error: "Error al procesar el pago. Intenta de nuevo." },
      { status: 500 }
    )
  }
}
