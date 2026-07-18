import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, serverError } from "@/lib/api-response"
import { handlePrismaError } from "@/lib/prisma-error"
import { checkRateLimit } from "@/lib/rate-limit"
import { validateCsrf } from "@/lib/csrf-middleware"
import { sendEmail, buildGiftEmail } from "@/lib/email"
import { z } from "zod"
import { logger } from "@/lib/logger"
import { PACK_ANALYSES } from "@/lib/pricing"

const giftSchema = z.object({
  packType: z.enum(["BASIC", "POPULAR", "ADVANCED"]),
  recipientEmail: z.string().email("Email inválido"),
})

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
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
    const analyses = PACK_ANALYSES[packType]
    if (!analyses) return error("Pack inválido")

    const giftCode = `GIFT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

    const gift = await db.giftPack.create({
      data: {
        buyerId: session.user.id,
        recipientEmail,
        packType,
        analyses,
        giftCode,
      },
    })

    const { subject, html } = buildGiftEmail({
      buyerName: session.user.name || "Un amigo",
      recipientEmail,
      giftCode,
      analyses,
      packType,
    })
    await sendEmail({ to: recipientEmail, subject, html })

    logger.info("Gift pack created", { giftId: gift.id, packType, recipientEmail })
    return ok({ giftCode, analyses })
  } catch (e) {
    const prismaRes = handlePrismaError(e)
    if (prismaRes) return prismaRes
    logger.error("Gift pack error", { error: e instanceof Error ? e.message : String(e) })
    return serverError(e)
  }
}
