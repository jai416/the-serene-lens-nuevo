import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, serverError, unauthorized } from "@/lib/api-response"
import { createQvaPayPackPayment, getPaymentError } from "@/lib/payments"
import { createPackCheckoutSession, getPriceId } from "@/lib/stripe-server"
import { getPack } from "@/lib/pricing"
import { getCUPRate } from "@/lib/cup-rate"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const { packType, provider = "stripe" } = await req.json()

    const packDef = getPack(packType)
    if (!packDef) {
      return error("Pack inválido")
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    if (provider === "stripe") {
      const priceId = getPriceId(packType)
      if (!priceId) {
        return error("Stripe no configurado para este pack")
      }

      try {
        const checkout = await createPackCheckoutSession({
          priceId,
          userId: session.user.id,
          email: session.user.email || "",
          packType,
          successUrl: `${baseUrl}/dashboard/subscription?pack=success`,
          cancelUrl: `${baseUrl}/pricing?payment=cancelled`,
        })

        if (checkout?.url) {
          return ok({ url: checkout.url, provider: "stripe" })
        }
        return error("Error al crear sesión de pago")
      } catch (e) {
        console.error("Stripe error:", e)
        return error(getPaymentError("stripe", e))
      }
    }

    try {
      const amount = packDef.priceUSD
      const cupRate = await getCUPRate()
      const qvapayPayment = await createQvaPayPackPayment({
        amount,
        description: `Pack ${packDef.name} - The Serene Lens`,
        plan: "",
        userId: session.user.id,
        packType,
      })

      if (qvapayPayment?.id) {
        await db.payment.create({
          data: {
            userId: session.user.id,
            provider: "qvapay",
            qvapayId: qvapayPayment.id,
            plan: packType,
            amount,
            amountUsd: amount,
            amountCup: amount * cupRate,
            remoteId: qvapayPayment.remote_id,
          },
        })
      }

      return ok({ url: qvapayPayment?.url, id: qvapayPayment?.id, provider: "qvapay" })
    } catch (e) {
      console.error("QvaPay error:", e)
      return error(getPaymentError("qvapay", e))
    }
  } catch (e) {
    return serverError(e)
  }
}
