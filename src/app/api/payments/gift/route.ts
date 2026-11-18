import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, serverError } from "@/lib/api-response"
import { handlePrismaError } from "@/lib/prisma-error"
import { checkRateLimit } from "@/lib/rate-limit"
import { validateCsrf } from "@/lib/csrf-middleware"
import { createPayPalOrder } from "@/lib/paypal"
import { z } from "zod"
import { logger } from "@/lib/logger"
import { getPack, PACK_ANALYSES } from "@/lib/pricing"
import { getClientIp } from "@/lib/client-ip"

const giftSchema = z.object({
  packType: z.enum(["BASIC", "POPULAR", "PACK_10", "ADVANCED", "PACK_25"]),
  recipientEmail: z.string().email("Email inválido"),
})

/**
 * Regalo DE PAGO: crea la orden de PayPal y deja el GiftPack en
 * "awaiting_payment". Solo pasa a "pending" (canjeable) cuando el webhook
 * o /api/payments/verify confirman el cobro — antes cualquiera podía
 * generarse análisis gratis creando un regalo para sí mismo.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const { allowed } = await checkRateLimit(`gift:${ip}`, 5, 60000)
    if (!allowed) return error("Demasiadas solicitudes. Intenta de nuevo en un minuto.", 429)

    if (!validateCsrf(req)) return error("CSRF token inválido", 403)

    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    let body: unknown
    try { body = await req.json() } catch { return error("Cuerpo de solicitud inválido") }

    const parsed = giftSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.issues.map((i) => i.message).join(", "), 400)

    const { packType, recipientEmail } = parsed.data
    const packDef = getPack(packType)
    const analyses = packDef?.analyses ?? PACK_ANALYSES[packType]
    if (!analyses || !packDef) return error("Pack inválido")

    const amount = packDef.priceUSD
    const giftCode = `GIFT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""

    // 1) Fila de pago (patrón idéntico a create-pack)
    const payment = await db.payment.create({
      data: {
        userId: session.user.id,
        provider: "paypal",
        plan: packType,
        status: "pending_creation",
        amount,
        amountUsd: amount,
        amountCup: Math.round(amount * 500),
      },
    })

    // 2) Regalo pendiente de pago (no canjeable aún)
    const gift = await db.giftPack.create({
      data: {
        buyerId: session.user.id,
        recipientEmail,
        packType,
        analyses,
        giftCode,
        status: "awaiting_payment",
        paypalOrderId: null,
      },
    })

    // 3) Orden de PayPal
    let approvalUrl: string
    let paypalOrderId: string
    try {
      const order = await createPayPalOrder({
        amount,
        description: `Regalo: Pack ${packDef.name} - The Serene Lens`,
        returnUrl: appUrl + "/pricing/success?provider=paypal&token=",
        cancelUrl: appUrl + "/pricing?cancelled=true&gift=1",
      })
      approvalUrl = order.approvalUrl
      paypalOrderId = order.id
    } catch (e) {
      await db.payment.update({ where: { id: payment.id }, data: { status: "failed" } })
      await db.giftPack.delete({ where: { id: gift.id } }).catch(() => {})
      throw e
    }

    if (!approvalUrl || !paypalOrderId) {
      await db.payment.update({ where: { id: payment.id }, data: { status: "failed" } })
      await db.giftPack.delete({ where: { id: gift.id } }).catch(() => {})
      return error("Error al generar enlace de pago")
    }

    await db.$transaction([
      db.payment.update({
        where: { id: payment.id },
        data: { paypalOrderId, status: "pending" },
      }),
      db.giftPack.update({
        where: { id: gift.id },
        data: { paypalOrderId },
      }),
    ])

    logger.info("Gift PayPal order created", { giftId: gift.id, packType, paypalOrderId })
    // El código se entrega tras el pago (webhook/verify → notificación)
    return ok({ url: approvalUrl, id: paypalOrderId, provider: "paypal", giftCode })
  } catch (e) {
    const prismaRes = handlePrismaError(e)
    if (prismaRes) return prismaRes
    const errMsg = e instanceof Error ? e.message : String(e)
    logger.error("Gift payment error", { error: errMsg })
    if (errMsg.includes("PayPal credentials")) {
      return error("Sistema de pagos no configurado. Contacta al soporte.", 503)
    }
    if (errMsg.includes("fetch failed") || errMsg.includes("ETIMEDOUT")) {
      return error("El servicio de pagos no está disponible. Intenta de nuevo.", 503)
    }
    return serverError(e)
  }
}
