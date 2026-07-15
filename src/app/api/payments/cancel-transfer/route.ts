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
    const rl = await checkRateLimit(`cancel-transfer:${session.user.id}:${ip}`, 30, 60000)
    if (!rl.allowed) return error("Demasiadas solicitudes. Intenta de nuevo en un minuto.", 429)

    const { referenceCode } = await req.json()
    if (!referenceCode) return error("Falta código de referencia")

    const transfer = await db.transferPayment.findUnique({ where: { referenceCode } })
    if (!transfer) return error("Transferencia no encontrada")
    if (transfer.status === "activated" || transfer.status === "cancelled") {
      return error("No se puede cancelar una transferencia activada o ya cancelada")
    }

    await db.$transaction([
      db.transferPayment.update({
        where: { id: transfer.id },
        data: { status: "cancelled" },
      }),
      db.auditLog.create({
        data: {
          userId: session.user.id,
          action: "cancel_transfer",
          targetId: transfer.id,
          targetType: "transfer",
          details: `Cancelled transfer ${referenceCode}`,
        },
      }),
    ])

    return ok({ message: "Transferencia cancelada correctamente" })
  } catch (e) {
    return serverError(e)
  }
}
