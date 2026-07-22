import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, serverError, unauthorized } from "@/lib/api-response"
import { handlePrismaError } from "@/lib/prisma-error"
import { checkRateLimit } from "@/lib/rate-limit"
import { createPayPalOrder, isPaypalConfigured } from "@/lib/paypal"
import { getPlan, getPack } from "@/lib/pricing"
import { getCUPRate } from "@/lib/cup-rate"
import { z } from "zod"
import { logger } from "@/lib/logger"
import { validateCsrf } from "@/lib/csrf-middleware"

const createPaymentSchema = z.object({
  plan: z.string().min(1),
  provider: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const { allowed } = await checkRateLimit(`payment:create:${ip}`, 10, 60000)
    if (!allowed) return error("Demasiadas solicitudes. Intenta de nuevo en un minuto.", 429)

    if (!validateCsrf(req)) return error("CSRF token inválido", 403)

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
    const packDef = getPack(parsed.data.plan)
    if (!planDef && !packDef) {
      return error("Plan o pack inválido")
    }
    if (planDef && planDef.priceUSD === 0) {
      return error("Plan gratuito no requiere pago")
    }

    const isPack = !!packDef
    const amount = planDef?.priceUSD ?? packDef!.priceUSD
    let cupRate = 500
    try {
      cupRate = await getCUPRate()
    } catch {
      logger.warn("CUP rate fetch failed, using default 500")
    }

    logger.info("Creating PayPal payment", { plan: parsed.data.plan, amount, userId: session.user.id, isPack })

    const existingIntent = await db.payment.findFirst({
      where: {
        userId: session.user.id,
        plan: parsed.data.plan,
        status: { in: ["pending_creation", "pending"] },
      },
    })
    if (existingIntent) {
      logger.info("Found existing pending payment", { paymentId: existingIntent.id, status: existingIntent.status, paypalOrderId: existingIntent.paypalOrderId })
      if (existingIntent.status === "pending_creation") {
        return error("Ya hay un pago en proceso para este plan. Espera unos segundos y vuelve a intentar.", 409)
      }
      return ok({ url: null, id: existingIntent.paypalOrderId, provider: "paypal", existing: true, paymentId: existingIntent.id })
    }

    const payment = await db.payment.create({
      data: {
        userId: session.user.id,
        provider: "paypal",
        plan: parsed.data.plan,
        status: "pending_creation",
        amount,
        amountUsd: amount,
        amountCup: amount * cupRate,
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"
    let paypalOrder: { id: string; approvalUrl: string }
    try {
      paypalOrder = await createPayPalOrder({
        amount,
        description: isPack ? `${packDef!.name} - The Serene Lens` : `Plan ${planDef!.name} - The Serene Lens`,
        returnUrl: appUrl + "/pricing/success?provider=paypal&token=",
        cancelUrl: appUrl + "/pricing?cancelled=true",
      })
    } catch (e) {
      await db.payment.update({
        where: { id: payment.id },
        data: { status: "failed" },
      })
      throw e
    }

    logger.info("PayPal order created", {
      orderId: paypalOrder.id,
      hasApprovalUrl: !!paypalOrder.approvalUrl,
    })

    if (paypalOrder.id) {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          paypalOrderId: paypalOrder.id,
          status: "pending",
        },
      })
    }

    return ok({ url: paypalOrder.approvalUrl, id: paypalOrder.id, provider: "paypal" })
  } catch (e) {
    const prismaRes = handlePrismaError(e)
    if (prismaRes) return prismaRes

    const errMsg = e instanceof Error ? e.message : String(e)
    logger.error("Payment create error", { error: errMsg })

    if (errMsg.includes("PayPal credentials")) {
      return error("Sistema de pagos no configurado. Contacta al soporte.", 503)
    }
    if (errMsg.includes("fetch failed") || errMsg.includes("ETIMEDOUT")) {
      return error("El servicio de pagos no está disponible. Intenta de nuevo.", 503)
    }

    return serverError(e)
  }
}
