import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, serverError, error } from "@/lib/api-response"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const clinic = await db.clinic.findUnique({
      where: { ownerId: session.user.id },
    })

    const analyses = await db.skinAnalysis.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, skinType: true, createdAt: true },
    })

    return ok({ clinic, analyses })
  } catch (e) {
    logger.error("clinic GET error", { error: e instanceof Error ? e.message : String(e) })
    return serverError()
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const body = await req.json()
    const { name, address, phone, logo } = body

    const existing = await db.clinic.findUnique({ where: { ownerId: session.user.id } })

    const data: any = {}
    if (name !== undefined) data.name = name
    if (address !== undefined) data.address = address
    if (phone !== undefined) data.phone = phone
    if (logo !== undefined) data.logo = logo

    const clinic = existing
      ? await db.clinic.update({ where: { ownerId: session.user.id }, data })
      : await db.clinic.create({
          data: { ...data, ownerId: session.user.id, name: name || "Mi Clínica", slug: `clinic-${session.user.id}` },
        })

    return ok({ clinic })
  } catch (e) {
    logger.error("clinic PUT error", { error: e instanceof Error ? e.message : String(e) })
    return serverError()
  }
}
