import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { capturePayPalOrder } from "@/lib/paypal"
import { handleSuccessfulPlanPayment } from "@/lib/services/payment.service"
import { ok, error, serverError, unauthorized } from "@/lib/api-response"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    let body: { orderId?: string; plan?: string }
    try {
      body = await req.json()
    } catch {
      return error("Cuerpo de solicitud inválido")
    }

    const { orderId, plan } = body
    if (!orderId || !plan) {
      return error("Faltan campos requeridos: orderId, plan")
    }

    const result = await capturePayPalOrder(orderId)

    if (!result.completed) {
      return error("El pago no fue completado", 400)
    }

    await handleSuccessfulPlanPayment(session.user.id, plan, "paypal", {
      qvapayId: orderId,
      amount: result.amount,
    })

    return ok({ captured: true, captureId: result.captureId })
  } catch (e) {
    console.error("PayPal capture error:", e)
    return serverError(e)
  }
}
