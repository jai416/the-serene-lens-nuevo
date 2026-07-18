import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, forbidden, serverError } from "@/lib/api-response"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    if (session.user.plan !== "ESTHETICIAN") return forbidden()

    const clinic = await db.clinic.findUnique({
      where: { ownerId: session.user.id },
      include: { _count: { select: { referredUsers: true } } },
    })
    if (!clinic) return error("Crea tu perfil de clínica primero")

    const discountCode = await db.discountCode.findFirst({
      where: { code: `EST-${clinic.referralCode.slice(4)}`, active: true },
    })

    return ok({
      clinic: {
        name: clinic.name,
        logo: clinic.logo,
        referralCode: clinic.referralCode,
        referredUsers: clinic._count.referredUsers,
      },
      discountCode: discountCode || null,
    })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    if (session.user.plan !== "ESTHETICIAN") return forbidden()

    const clinic = await db.clinic.findUnique({ where: { ownerId: session.user.id } })
    if (!clinic) return error("Crea tu perfil de clínica primero")

    const code = `EST-${clinic.referralCode.slice(4)}`
    const existing = await db.discountCode.findUnique({ where: { code } })

    if (existing) return ok({ discountCode: existing })

    const discount = await db.discountCode.create({
      data: {
        code,
        discount: 20,
        maxUses: 50,
        active: true,
        createdBy: "esthetician:" + session.user.id,
        expiresAt: new Date(Date.now() + 365 * 86400000),
      },
    })

    return ok({ discountCode: discount }, 201)
  } catch (e) {
    return serverError(e)
  }
}
