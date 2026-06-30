import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, forbidden } from "@/lib/api-response"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return unauthorized()
  if (session.user.role !== "ADMIN" && session.user.role !== "VALIDATOR") return forbidden()

  const { referenceCode } = await req.json()
  if (!referenceCode) return error("Falta código de referencia")

  const transfer = await db.transferPayment.findUnique({ where: { referenceCode } })
  if (!transfer) return error("Transferencia no encontrada")
  if (transfer.status !== "pending") return error("La transferencia ya fue procesada")

  await db.$transaction([
    db.transferPayment.update({
      where: { id: transfer.id },
      data: { status: "validated", validatedById: session.user.id, validatedAt: new Date() },
    }),
    db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "validate_transfer",
        targetId: transfer.id,
        targetType: "transfer",
        details: `Validated transfer ${referenceCode} for ${transfer.plan}`,
      },
    }),
  ])

  return ok({ message: "Pago validado correctamente" })
}
