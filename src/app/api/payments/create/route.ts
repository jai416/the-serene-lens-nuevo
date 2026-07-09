import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, serverError, unauthorized } from "@/lib/api-response"
import { handlePrismaError } from "@/lib/prisma-error"
import { checkRateLimit } from "@/lib/rate-limit"
import { createQvaPayPayment, createQvaPayPackPayment } from "@/lib/payments"
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

    logger.info("Creating QvaPay payment", { plan: parsed.data.plan, amount, userId: session.user.id, isPack })

    let qvapayPayment: any
    if (isPack) {
      qvapayPayment = await createQvaPayPackPayment({
        amount,
        description: `${packDef!.name} - The Serene Lens`,
        plan: parsed.data.plan,
        userId: session.user.id,
        packType: parsed.data.plan,
      })
    } else {
      qvapayPayment = await createQvaPayPayment({
        amount,
        description: `Plan ${planDef!.name} - The Serene Lens`,
        plan: parsed.data.plan,
        userId: session.user.id,
      })
    }

    logger.info("QvaPay invoice created", {
      invoice_id: qvapayPayment?.invoice_id,
      transaction_uuid: qvapayPayment?.transaction_uuid,
      hasUrl: !!qvapayPayment?.url,
      url: qvapayPayment?.url,
      keys: qvapayPayment ? Object.keys(qvapayPayment) : [],
    })

    const transactionUuid = qvapayPayment?.invoice_id || qvapayPayment?.transaction_uuid
    if (transactionUuid) {
      await db.payment.create({
        data: {
          userId: session.user.id,
          provider: "qvapay",
          qvapayId: String(transactionUuid),
          plan: parsed.data.plan,
          amount,
          amountUsd: amount,
          amountCup: amount * cupRate,
          remoteId: qvapayPayment.remote_id,
        },
      })
    }

    return ok({ url: qvapayPayment?.url, id: transactionUuid, provider: "qvapay" })
  } catch (e) {
    const prismaRes = handlePrismaError(e)
    if (prismaRes) return prismaRes

    const errMsg = e instanceof Error ? e.message : String(e)
    logger.error("Payment create error", { error: errMsg })

    if (errMsg.includes("QvaPay credentials")) {
      return error("Sistema de pagos no configurado. Contacta al soporte.", 503)
    }
    if (errMsg.includes("fetch failed") || errMsg.includes("ETIMEDOUT")) {
      return error("El servicio de pagos no está disponible. Intenta de nuevo.", 503)
    }

    return serverError(e)
  }
}
