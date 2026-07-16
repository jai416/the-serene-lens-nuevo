import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized } from "@/lib/api-response"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return unauthorized()

    const subscription = await db.subscription.findFirst({
      where: { userId: session.user.id, status: "active" },
      orderBy: { createdAt: "desc" },
      select: {
        plan: true,
        status: true,
        provider: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        createdAt: true,
      },
    })

    return ok({ subscription })
  } catch (e) {
    return NextResponse.json({ error: "Error al obtener suscripción" }, { status: 500 })
  }
}
