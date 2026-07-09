import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createPayPalOrder } from "@/lib/paypal"
import { getPlan, getPack } from "@/lib/pricing"
import { ok, error, serverError, unauthorized } from "@/lib/api-response"

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

    const planDef = getPlan(plan)
    const packDef = getPack(plan)
    const price = amount || planDef?.priceUSD || packDef?.priceUSD
    if (!price || price <= 0) {
      return error("Plan o pack inválido")
    }

    const label = planDef?.name || packDef?.name || plan
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"
    const order = await createPayPalOrder({
      amount: price,
      description: `${label} - The Serene Lens`,
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
