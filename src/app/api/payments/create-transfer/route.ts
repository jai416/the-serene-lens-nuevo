import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { handlePrismaError } from "@/lib/prisma-error"
import { generateReferenceCode, getTransferConfig } from "@/lib/transfer-payment"
import { ok, error, unauthorized, serverError } from "@/lib/api-response"
import { z } from "zod"
import { getPlan, getPack } from "@/lib/pricing"
import { validateCsrf } from "@/lib/csrf-middleware"
import { logger } from "@/lib/logger"

const PLAN_IDS = ["FREE", "PREMIUM", "PRO", "PRO_PLUS", "ESTHETICIAN", "PREMIUM_ANNUAL", "PRO_ANNUAL"] as const
const PACK_IDS = ["BASIC", "POPULAR", "ADVANCED"] as const

const createTransferSchema = z.object({
  plan: z.string(),
  amount: z.number().positive(),
})

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return unauthorized()

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return error("Cuerpo de solicitud inválido")
    }

    const parsed = createTransferSchema.safeParse(body)
    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "), 400)
    }

    const { plan, amount } = parsed.data
    const planDef = getPlan(plan)
    const packDef = getPack(plan)

    if (!planDef && !packDef) return error("Plan o pack inválido")
    const expectedAmount = planDef?.priceUSD ?? packDef?.priceUSD ?? 0

    if (Math.abs(amount - expectedAmount) > 0.01) {
      return error("Monto no coincide con el plan seleccionado")
    }

    const config = getTransferConfig()
    const referenceCode = await generateReferenceCode()

    const transfer = await db.transferPayment.create({
      data: {
        userId: session.user.id,
        plan,
        amount,
        referenceCode,
        transferAccount: config.account,
        transferHolder: config.holder,
        status: "pending",
      },
    })

    return ok({
      referenceCode: transfer.referenceCode,
      account: config.account,
      holder: config.holder,
      amount: transfer.amount,
      plan: transfer.plan,
      id: transfer.id,
    })
  } catch (e) {
    const prismaRes = handlePrismaError(e)
    if (prismaRes) return prismaRes

    const errMsg = e instanceof Error ? e.message : String(e)
    logger.error("Transfer payment create error", { error: errMsg })
    if (errMsg.includes("does not exist in the database") || errMsg.includes("relation") || errMsg.includes("does not exist")) {
      return error("El sistema de pagos no está listo. Contacta al soporte.", 503)
    }
    return error("Error al procesar el pago. Intenta de nuevo.", 500)
  }
}
