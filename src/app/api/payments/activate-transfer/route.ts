import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, forbidden } from "@/lib/api-response"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return unauthorized()
  if (session.user.role !== "ADMIN") return forbidden()

  const { referenceCode } = await req.json()
  if (!referenceCode) return error("Falta código de referencia")

  const transfer = await db.transferPayment.findUnique({
    where: { referenceCode },
    include: { user: true },
  })
  if (!transfer) return error("Transferencia no encontrada")
  if (transfer.status !== "validated") return error("La transferencia debe estar validada primero")

  await db.$transaction([
    db.transferPayment.update({
      where: { id: transfer.id },
      data: { status: "activated", activatedById: session.user.id, activatedAt: new Date() },
    }),
    db.subscription.create({
      data: {
        userId: transfer.userId,
        plan: transfer.plan,
        provider: "transfer",
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
    db.payment.create({
      data: {
        userId: transfer.userId,
        provider: "transfer",
        plan: transfer.plan,
        amount: transfer.amount,
        status: "completed",
        confirmedAt: new Date(),
        remoteId: transfer.referenceCode,
      },
    }),
    db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "activate_transfer",
        targetId: transfer.id,
        targetType: "transfer",
        details: `Activated transfer ${referenceCode} for ${transfer.plan}`,
      },
    }),
  ])

  return ok({ message: "Acceso activado correctamente" })
}
