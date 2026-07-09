import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createPayPalOrder } from "@/lib/paypal"
import { ok, error, serverError, unauthorized } from "@/lib/api-response"

const VALID_PLANS = ["FREE", "PREMIUM", "PRO", "PRO_PLUS"] as const
const PLAN_PRICES: Record<string, number> = {
  PREMIUM: 4.99,
  PRO: 9.99,
  PRO_PLUS: 14.99,
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    let body: { plan?: string; amount?: number }
    try {
      body = await req.json()
    } catch {
      return error("Cuerpo de solicitud inválido")
    }

    const { plan, amount } = body
    if (!plan) {
      return error("Falta campo requerido: plan")
    }

    const price = amount || PLAN_PRICES[plan]
    if (!price || price <= 0) {
      return error("Monto inválido")
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"
    const order = await createPayPalOrder({
      amount: price,
      description: `Plan ${plan} - The Serene Lens`,
      returnUrl: `${appUrl}/pricing/success?plan=${plan}`,
      cancelUrl: `${appUrl}/pricing/cancel`,
      invoiceId: `${session.user.id}_${Date.now()}`,
    })

    return ok({ orderId: order.orderId, approvalUrl: order.approvalUrl })
  } catch (e) {
    console.error("PayPal create error:", e)
    return serverError(e)
  }
}
