import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, serverError, unauthorized } from "@/lib/api-response"
import { createQvaPayPayment, getPaymentError } from "@/lib/payments"
import { createSubscriptionCheckoutSession, getPriceId } from "@/lib/stripe-server"
import { getPlan, CUP_RATE } from "@/lib/pricing"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const { plan, provider = "stripe" } = await req.json()

    const planDef = getPlan(plan)
    if (!planDef || planDef.priceUSD === 0) {
      return error("Plan inválido")
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    if (provider === "stripe") {
      const priceId = getPriceId(plan)
      if (!priceId) {
        return error("Stripe no configurado para este plan")
      }

      try {
        const checkout = await createSubscriptionCheckoutSession({
          priceId,
          userId: session.user.id,
          email: session.user.email || "",
          plan,
          successUrl: `${baseUrl}/dashboard/subscription?payment=success`,
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
      const amount = planDef.priceUSD
      const qvapayPayment = await createQvaPayPayment({
        amount,
        description: `Plan ${planDef.name} - The Serene Lens`,
        plan,
        userId: session.user.id,
      })

      if (qvapayPayment?.id) {
        await db.payment.create({
          data: {
            userId: session.user.id,
            provider: "qvapay",
            qvapayId: qvapayPayment.id,
            plan,
            amount,
            amountUsd: amount,
            amountCup: amount * CUP_RATE,
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
