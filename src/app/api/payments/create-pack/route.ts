import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, serverError, unauthorized } from "@/lib/api-response"
import { createQvaPayPackPayment, getPaymentError } from "@/lib/payments"
import { getPack } from "@/lib/pricing"
import { getCUPRate } from "@/lib/cup-rate"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    let body: { packType?: string }
    try {
      body = await req.json()
    } catch {
      return error("Cuerpo de solicitud inválido")
    }

    const { packType } = body

    if (!packType || typeof packType !== "string") {
      return error("Tipo de pack inválido")
    }

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
        console.error("[create-pack] QvaPay API error:", e)
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
          console.error("[create-pack] DB payment save error:", e)
        }
      }

      if (!qvapayPayment?.url) {
        console.error("[create-pack] QvaPay returned no URL:", qvapayPayment)
        return error("Error al generar enlace de pago")
      }

      return ok({ url: qvapayPayment.url, id: transactionUuid, provider: "qvapay" })
    } catch (e) {
      console.error("[create-pack] QvaPay flow error:", e)
      return error(getPaymentError("qvapay", e))
    }
  } catch (e) {
    console.error("[create-pack] Unexpected error:", e)
    return serverError(e)
  }
}
