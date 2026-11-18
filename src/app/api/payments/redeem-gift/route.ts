import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, serverError } from "@/lib/api-response"
import { handlePrismaError } from "@/lib/prisma-error"
import { validateCsrf } from "@/lib/csrf-middleware"
import { z } from "zod"
import { logger } from "@/lib/logger"
import { checkRateLimit } from "@/lib/rate-limit"

const redeemSchema = z.object({
  giftCode: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)

    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const { allowed } = await checkRateLimit(`redeem-gift:${session.user.id}`, 5, 60 * 60 * 1000)
    if (!allowed) return error("Demasiados canjes. Espera un momento.", 429)

    const body = await req.json().catch(() => ({}))
    const parsed = redeemSchema.safeParse(body)
    if (!parsed.success) return error("Código de regalo inválido", 400)

    const gift = await db.giftPack.findUnique({
      where: { giftCode: parsed.data.giftCode },
    })
    if (!gift) return error("Código de regalo no encontrado", 404)
    if (gift.status === "awaiting_payment") {
      return error("Este regalo aún no está pagado. El comprador debe completar el pago en PayPal.", 400)
    }
    if (gift.status !== "pending") return error("Este regalo ya fue canjeado", 400)

    if (gift.recipientEmail !== session.user.email) return error("Este regalo no está dirigido a ti", 403)

    await db.$transaction(async (tx) => {
      await tx.giftPack.update({
        where: { id: gift.id },
        data: {
          status: "redeemed",
          redeemedById: session.user.id,
          redeemedAt: new Date(),
        },
      })
      await tx.purchasePack.create({
        data: {
          userId: session.user.id,
          packType: gift.packType,
          provider: "gift",
          amountUsd: 0,
          amountCup: 0,
          analyses: gift.analyses,
          status: "completed",
        },
      })
    })

    logger.info("Gift redeemed", { giftId: gift.id, userId: session.user.id })
    return ok({ analyses: gift.analyses })
  } catch (e) {
    const prismaRes = handlePrismaError(e)
    if (prismaRes) return prismaRes
    logger.error("Gift redeem error", { error: e instanceof Error ? e.message : String(e) })
    return serverError(e)
  }
}
