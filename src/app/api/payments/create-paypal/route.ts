import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
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
    if (!plan || !amount) {
      return error("Faltan campos requeridos: plan, amount")
    }

    const orderId = "PAYPAL_" + Date.now()
    const approvalUrl = `https://paypal.com/checkout?token=${orderId}`

    return ok({ orderId, approvalUrl })
  } catch (e) {
    return serverError(e)
  }
}
