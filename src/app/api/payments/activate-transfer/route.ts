import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, forbidden, serverError } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return unauthorized()
    if (session.user.role !== "ADMIN") return forbidden()

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const rl = await checkRateLimit(`activate-transfer:${session.user.id}:${ip}`, 30, 60000)
    if (!rl.allowed) return error("Demasiadas solicitudes. Intenta de nuevo en un minuto.", 429)

    const { referenceCode } = await req.json()
    if (!referenceCode) return error("Falta código de referencia")

    const transfer = await db.transferPayment.findUnique({
      where: { referenceCode },
      include: { user: true },
    })
    if (!transfer) return error("Transferencia no encontrada")
    if (transfer.status !== "validated") return error("La transferencia debe estar validada primero")

    const isAnnual = transfer.plan.endsWith("_ANNUAL")
    const periodEnd = new Date()
    periodEnd.setDate(periodEnd.getDate() + (isAnnual ? 365 : 30))

    await db.$transaction(async (tx) => {
      const result = await tx.transferPayment.updateMany({
        where: { id: transfer.id, status: "validated" },
        data: { status: "activated", activatedById: session.user.id, activatedAt: new Date() },
      })

      if (result.count === 0) {
        throw new Error("La transferencia ya fue activada por otro administrador")
      }

      await tx.user.update({
        where: { id: transfer.userId },
        data: { plan: transfer.plan },
      })

      await tx.subscription.create({
        data: {
          userId: transfer.userId,
          plan: transfer.plan,
          provider: "transfer",
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
        },
      })

      await tx.payment.create({
        data: {
          userId: transfer.userId,
          provider: "transfer",
          plan: transfer.plan,
          amount: transfer.amount,
          status: "completed",
          confirmedAt: new Date(),
          remoteId: transfer.referenceCode,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "activate_transfer",
          targetId: transfer.id,
          targetType: "transfer",
          details: `Activated transfer ${referenceCode} for ${transfer.plan}`,
          ip,
          userAgent: req.headers.get("user-agent") || "",
        },
      })
    })

    return ok({ message: "Acceso activado correctamente" })
  } catch (e) {
    return serverError(e)
  }
}
